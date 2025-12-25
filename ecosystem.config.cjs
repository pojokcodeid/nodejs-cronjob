module.exports = {
  apps: [
    {
      name: "nodejs-cron-job",
      script: "./src/index.js",
      watch: false,
      autorestart: true,
      ignore_watch: ["node_modules", "logs"],
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
