
import Salary from "../models/salary.js";
import OvertimePolicy from "../models/overTimePolicy.js";
import { ENUMS } from "../utils/constants.js";

export const totalMonthSalary = async (userId, start, end) => {
  return await Salary.find({
    userId,
    startDate: { $lte: end },
    endDate: { $gte: start },
  }).lean();
}



// export const toISTDateString = (d) => {
//   const t = new Date(d).getTime() + 5.5 * 60 * 60 * 1000;
//   return new Date(t).toISOString().slice(0, 10);
// };
// export const sameDay = (d1, d2) => toISTDateString(d1) === toISTDateString(d2);

// export const getUTCRangeForISTDate = (y, m, d) => {
//   const istMidnightUTCms = Date.UTC(y, m - 1, d, 0, 0, 0) - 5.5 * 60 * 60 * 1000;
//   const startUTC = new Date(istMidnightUTCms);
//   const endUTC = new Date(istMidnightUTCms + 24 * 60 * 60 * 1000 - 1);
//   return { startUTC, endUTC };
// };

// export const parseYMD = (s) => {
//   const [y, mm, dd] = s.split("-").map(Number);
//   return { y, m: mm, d: dd };
// };


