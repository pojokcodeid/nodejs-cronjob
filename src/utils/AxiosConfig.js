import axios from "axios";
import dotenv from "dotenv";
import { logger } from "./Winston.js"; // Ensure .js extension for ESM

dotenv.config();

axios.defaults.baseURL = process.env.API_BASE_URL;
axios.defaults.timeout = process.env.API_TIMEOUT;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

const api = axios.create();

let acessToken = "";
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

const parseJwt = token => {
    try {
        return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    } catch (e) {
        return null;
    }
};

const isTokenExpired = token => {
    if (!token) return true;
    const decodedVal = parseJwt(token);
    if (!decodedVal || !decodedVal.exp) return true;

    // Check if token is expired or expires in less than 10 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedVal.exp - 10 < currentTime;
};

const refreshAuthLogic = async () => {
    try {
        const response = await axios.post(
            process.env.API_BASE_URL,
            new URLSearchParams({
                accname: process.env.ACCNAME,
                api_key: process.env.APIKEY
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
                }
            }
        );
        const newToken = response.data.DATA.ACCESS_TOKEN;
        acessToken = newToken;
        return newToken;
    } catch (error) {
        logger.error(`Token Refresh Failed: ${error.message}`);
        throw error;
    }
};

api.interceptors.request.use(
    async config => {
        // Skip auth check for the refresh endpoint itself if it matches the baseURL
        // In this case, refresh logic uses axios (global) whereas this interceptor is on 'api' instance.
        // However, if the refresh logic used 'api', we would need to check existing config.url.

        if (isTokenExpired(acessToken)) {
            if (!isRefreshing) {
                isRefreshing = true;
                refreshAuthLogic()
                    .then(token => {
                        isRefreshing = false;
                        processQueue(null, token);
                    })
                    .catch(err => {
                        isRefreshing = false;
                        processQueue(err, null);
                    });
            }

            // Return a promise that resolves when the token is refreshed
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: token => {
                        config.headers.Authorization = `Bearer ${token}`;
                        resolve(config);
                    },
                    reject: err => {
                        reject(err);
                    }
                });
            });
        }

        config.headers.Authorization = `Bearer ${acessToken}`;
        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Handle 401 if it happens despite the proactive check (e.g., token revoked)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        },
                        reject: err => {
                            reject(err);
                        }
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAuthLogic();
                isRefreshing = false;
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const axiosInstance = api;
