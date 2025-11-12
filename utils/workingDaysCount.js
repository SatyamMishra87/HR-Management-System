// import Attendance from "../models/Attendance.js";
// import Holiday from "../models/Holiday.js";
// import Shift from "../models/Shift.js";
// import { ENUMS } from "../utils/constants.js";
// import { getUserSalaryForDate } from "./helper.js";

// export const calculateSalaryDetails = async (userId, startDate, endDate, perDaySalary) => {
//   const shift = await Shift.findOne({ assignUsers: userId });
//   if (!shift) throw new Error("Shift not assigned to user");
//   const holidays = await Holiday.find({
//      assignUsers: userId,
//     $or: [
//       { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
//     ]
//   });

//   const holidayRanges = holidays.map(h => ({
//     start: h.startDate,
//     end: h.endDate || h.startDate
//   }));

//   let totalWorkingDays = 0;
//   let totalShiftHours = 0;
//   let presentDays = 0;

//   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//     const dayOfWeek = d.getDay(); 

//     const shiftDay = shift.days.get(String(dayOfWeek));
//     if (!shiftDay || shiftDay.dayStatus === ENUMS.DAY_STATUS.WEEKEND) continue;

//     const isHoliday = holidayRanges.some(h => d >= h.start && d <= h.end);
//     if (isHoliday) continue;

//     totalWorkingDays++;

//     const shiftHours = (shiftDay.dayStatus === ENUMS.DAY_STATUS.FIRSTHALF || shiftDay.dayStatus === ENUMS.DAY_STATUS.SECONDHALF)
//       ? shift.halfDayHrs
//       : shift.fullDayHrs;

//     totalShiftHours += shiftHours;

//     const attendance = await Attendance.findOne({
//       userId,
//       date: d,
//       clockIn: { $ne: null }
//     });

//     if (attendance) presentDays++;
//   }

  
//   // 4️⃣ Calculate per-hour salary
//   const perHourSalary = totalShiftHours > 0 ? perDaySalary / (totalShiftHours / totalWorkingDays) : 0;

//   return { totalWorkingDays, presentDays, totalShiftHours, perHourSalary };
// };
