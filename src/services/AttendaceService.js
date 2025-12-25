import { poolPromise } from "../config/Db.js";
import { logger } from "../utils/Winston.js";
import moment from "moment";
export const getAttendanceData = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .query(
                "select top 2 id, [DateTime],[Date], [Time], seq_id  from  attendance where status =0 order by [DateTime] asc"
            );
        const data = result.recordset;
        const resultId = [];
        const resultData = [];
        data.forEach(item => {
            resultData.push({
                MACHINE_CODE: "HKV",
                COMPANY_ID: 35077,
                EMPLOYEE_NO: item.id,
                IN_OUT_STATUS: "0",
                ATTEND_HOURS: moment(item.datetime).format("HH:mm"),
                ATTEND_DATE: moment(item.datetime).format("YYYY-MM-DD")
            });
            resultId.push(item.seq_id);
        });
        return { resultData, resultId };
    } catch (error) {
        logger.error("Error fetching attendance data:", error);
        throw error;
    }
};

export const updateAttendanceStatus = async arraySecId => {
    try {
        const pool = await poolPromise;
        await pool.request().query(`update attendance set status = 1 where seq_id in (${arraySecId.join(",")})`);
    } catch (error) {
        logger.error("Error updating attendance status:", error);
        throw error;
    }
};
