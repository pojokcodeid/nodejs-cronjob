import express from "express";
import cron from "node-cron";
import "./utils/Winston.js";
import "dotenv/config";
import { AttendacneSend } from "./controllers/AttendacneSend.js";
import { getAttendanceData } from "./services/AttendaceService.js";
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", async (req, res) => {
    const result = await getAttendanceData();
    res.json(result);
});

// Cron Job: Runs every 15 minutes
// Schedule: */15 * * * *
cron.schedule("*/2 * * * *", async () => {
    await AttendacneSend();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Cron job scheduled for every 15 minutes (*/15 * * * *)");
});
