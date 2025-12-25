import "dotenv/config";
import { axiosInstance } from "../utils/AxiosConfig.js";
import { logger } from "../utils/Winston.js";
import { getAttendanceData, updateAttendanceStatus } from "../services/AttendaceService.js";

export const AttendacneSend = async () => {
    try {
        const { resultData, resultId } = await getAttendanceData();
        const baseURL = process.env.API_BASE_URL;
        const response = await axiosInstance.post(baseURL + "?qlid=CL_AttendanceTemp.setProcessAtt", {
            data: resultData
        });
        if (response.data.HSTATUS === 200) {
            await updateAttendanceStatus(resultId);
            logger.info(`Send Attendance ${resultData.length} Success ...`);
        }
        return response.data;
    } catch (error) {
        logger.error(`Error process send attendance: ${error.message}`);
        throw error;
    }
};
