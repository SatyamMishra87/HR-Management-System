import User from "../models/auth.js";
import Attendance from "../models/Attendance.js";
import AttendanceLog from "../models/AttendanceLog.js";
import Holiday from "../models/Holiday.js";
import OvertimePolicy from "../models/overTimePolicy.js";
import PenalisationPolicy from "../models/PenalisationPolicy.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  getCurrentUTC,
  getAttendanceDate,
  durationInSeconds,
  getShiftStartUTC,
  getShiftEndUTC,
  checkEarlyOut,
  calculateLateIn,
  IST_OFFSET_MIN,
} from "../utils/time.js";
import { ENUMS } from "../utils/constants.js";
dotenv.config();

const AttendanceController = async ({ type, data }, callback) => {
  try {
    const { token, reason } = data;
    if (!token) return callback({ success: false, error: "Unauthorized: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).populate("assignedShift");
    console.log(user);
    if (!user) return callback({ success: false, error: "User not found" });

    // Fetch penalisation policy for user's location
    const penalisationPolicy = await PenalisationPolicy.findOne({ 
      locationId: user.locationId 
    });

    const currentTimeUTC = getCurrentUTC();
    const attendanceDate = getAttendanceDate();
    console.log("attendanceDate", attendanceDate);

    let todayAttendance = await Attendance.findOne({
      userId: user._id,
      date: attendanceDate,
    });
    console.log("todayattendance", todayAttendance);

    switch (type) {
      case "clockIn": {
        const activeWorkLog = await AttendanceLog.findOne({
          userId: user._id,
          type: ENUMS.LOG_TYPE.WORK,
          outTime: null,
        });
        console.log(activeWorkLog);
        if (activeWorkLog) return callback({ success: false, error: "Already clocked in" });
      
        const activeBreakLog = await AttendanceLog.findOne({
          userId: user._id,
          type: ENUMS.LOG_TYPE.BREAK,
          outTime: null,
        });
        console.log(activeBreakLog);
        if (activeBreakLog) return callback({ success: false, error: "Already clocked in" });
        
        const holiday = await Holiday.findOne({
          startDate: { $lte: attendanceDate },
          endDate: { $gte: attendanceDate }
        });

        console.log("holiday", holiday);

        const isHoliday = holiday && (holiday.assignUsers.some(uId => uId.equals(user._id)));

        const istForDay = new Date(attendanceDate.getTime() + IST_OFFSET_MIN * 60 * 1000);
        const dayOfWeek = istForDay.getUTCDay();
        const shiftDay = user.assignedShift?.days?.get(String(dayOfWeek));
        const isWeekend = shiftDay?.dayStatus === ENUMS.DAY_STATUS.WEEKEND;

        if (!user.assignedShift) return callback({ success: false, error: "No shift assigned" });
        if (!shiftDay) return callback({ success: false, error: "Shift not defined for today" });
        
        const shiftStartUTC = getShiftStartUTC(shiftDay.start, attendanceDate);
        
        // Use penalisation policy grace if available, else default
        const graceMinutes = penalisationPolicy?.enableLatePolicy 
          ? penalisationPolicy.lateGraceMinutes 
          : 15;
        
        let { lateIn, lateInDuration } = calculateLateIn(shiftStartUTC, currentTimeUTC, graceMinutes);
        let dayStatus;
        
        if (!todayAttendance) {
          if (isHoliday || isWeekend) {
            lateIn = false;
            lateInDuration = 0;
            dayStatus = isHoliday ? ENUMS.DAY_STATUS.HOLIDAY : ENUMS.DAY_STATUS.WEEKEND;
          }
          
          todayAttendance = await Attendance.create({
            userId: user._id,
            shiftId: user.assignedShift._id,
            date: attendanceDate,
            clockIn: currentTimeUTC,
            islateIn: lateIn,
            lateInDuration: lateInDuration,
            totalWorkSeconds: 0,
            totalBreakSeconds: 0,
            dayStatus: dayStatus ? dayStatus : shiftDay.dayStatus || ENUMS.DAY_STATUS.WORKING,
          });
        } else {
          todayAttendance.isEarlyOut = false;
          todayAttendance.EarlyOutDuration = 0;
          await todayAttendance.save();
        }
        
        // Create work log
        const workLog = await AttendanceLog.create({
          attendanceId: todayAttendance._id,
          userId: user._id,
          date: attendanceDate,
          type: ENUMS.LOG_TYPE.WORK,
          inTime: currentTimeUTC,
        });

        return callback({ 
          success: true, 
          message: lateIn ? "Clock-in successful (Late arrival recorded)" : "Clock-in successful", 
          todayAttendance, 
          workLog 
        });
      }

      case "breakIn": {
        if (!todayAttendance) return callback({ success: false, error: "Attendance not found" });

        const activeWorkLog = await AttendanceLog.findOne({
          attendanceId: todayAttendance._id,
          userId: user._id,
          type: ENUMS.LOG_TYPE.WORK,
          outTime: null,
        });
        console.log(activeWorkLog);
        if (!activeWorkLog) return callback({ success: false, error: "No active work session to start break" });

        activeWorkLog.outTime = currentTimeUTC;
        activeWorkLog.workDuration = durationInSeconds(activeWorkLog.inTime, activeWorkLog.outTime);
        await activeWorkLog.save();

        todayAttendance.totalWorkSeconds = (todayAttendance.totalWorkSeconds || 0) + activeWorkLog.workDuration;
        await todayAttendance.save();

        const breakLog = await AttendanceLog.create({
          attendanceId: todayAttendance._id,
          userId: user._id,
          date: attendanceDate,
          type: ENUMS.LOG_TYPE.BREAK,
          inTime: currentTimeUTC,
          reason,
        });

        return callback({ success: true, message: "Break started", todayAttendance, breakLog });
      }

      case "breakOut": {
        if (!todayAttendance) return callback({ success: false, error: "Attendance not found" });
        
        const activeBreakLog = await AttendanceLog.findOne({
          attendanceId: todayAttendance._id,
          userId: user._id,
          type: ENUMS.LOG_TYPE.BREAK,
          outTime: null,
        });
        if (!activeBreakLog) return callback({ success: false, error: "No active break to end" });

        activeBreakLog.outTime = currentTimeUTC;
        activeBreakLog.breakDuration = durationInSeconds(activeBreakLog.inTime, activeBreakLog.outTime);
        await activeBreakLog.save();

        todayAttendance.totalBreakSeconds = (todayAttendance.totalBreakSeconds || 0) + activeBreakLog.breakDuration;
        await todayAttendance.save();

        const workLog = await AttendanceLog.create({
          attendanceId: todayAttendance._id,
          userId: user._id,
          date: attendanceDate,
          type: ENUMS.LOG_TYPE.WORK,
          inTime: currentTimeUTC,   
        });
        
        return callback({ success: true, message: "Break ended, work resumed", todayAttendance, workLog });
      }  

      case "clockOut": {
        if (!todayAttendance) return callback({ success: false, error: "Attendance not found" });
        
        const activeBreakLog = await AttendanceLog.findOne({
          attendanceId: todayAttendance._id,
          userId: user._id,
          type: ENUMS.LOG_TYPE.BREAK,
          outTime: null,
        });
        if (activeBreakLog) return callback({ success: false, error: "You are in break" });

        const activeWorkLog = await AttendanceLog.findOne({
          attendanceId: todayAttendance._id,
          userId: user._id,
          type: ENUMS.LOG_TYPE.WORK,
          outTime: null,
        });
        if (!activeWorkLog) return callback({ success: false, error: "No active work session to clock out" });

        activeWorkLog.outTime = currentTimeUTC;
        activeWorkLog.workDuration = durationInSeconds(activeWorkLog.inTime, activeWorkLog.outTime);
        await activeWorkLog.save();

        todayAttendance.totalWorkSeconds = (todayAttendance.totalWorkSeconds || 0) + activeWorkLog.workDuration;
        todayAttendance.clockOut = currentTimeUTC;

        const istForDay = new Date(attendanceDate.getTime() + IST_OFFSET_MIN * 60 * 1000);
        const dayOfWeek = istForDay.getUTCDay();
        const shiftDay = user.assignedShift?.days?.get(String(dayOfWeek));
        console.log(shiftDay);

        if (todayAttendance.dayStatus === ENUMS.DAY_STATUS.HOLIDAY || todayAttendance.dayStatus === ENUMS.DAY_STATUS.WEEKEND) {
          if ((todayAttendance.totalWorkSeconds || 0) > 0) {
            todayAttendance.isOverTime = true;
            todayAttendance.ExtraTime = todayAttendance.totalWorkSeconds;
          }
          await todayAttendance.save();
          return callback({ success: true, message: `${todayAttendance.dayStatus} clock-out (OT calculated)`, todayAttendance });
        }

        // Use penalisation policy grace for early out if available
        const earlyOutGrace = penalisationPolicy?.enableEarlyOutPolicy 
          ? penalisationPolicy.earlyOutGraceMinutes 
          : 10;

        const shiftEndUTC = getShiftEndUTC(shiftDay.end, attendanceDate);
        const { earlyOut, earlyOutDuration } = checkEarlyOut(currentTimeUTC, shiftEndUTC, earlyOutGrace);
        
        todayAttendance.isEarlyOut = earlyOut;
        todayAttendance.EarlyOutDuration = earlyOutDuration;
        
        const otpolicy = await OvertimePolicy.findById(user.assignedOvertimePolicy);
        console.log(otpolicy);
        
        let shiftSeconds = 0;
        if (
          shiftDay?.dayStatus === ENUMS.DAY_STATUS.FIRSTHALF ||
          shiftDay?.dayStatus === ENUMS.DAY_STATUS.SECONDHALF
        ) {
          shiftSeconds = (user.assignedShift?.halfDayHrs || 0) * 3600;
        } else {
          shiftSeconds = (user.assignedShift?.fullDayHrs || 0) * 3600;
        }
        console.log("shiftsecond", shiftSeconds);

        if (todayAttendance.totalWorkSeconds > shiftSeconds) {
          const extratime = Math.max(0, todayAttendance.totalWorkSeconds - shiftSeconds);
          todayAttendance.isOverTime = true;
          todayAttendance.ExtraTime = extratime;
        }
        
        await todayAttendance.save();
        
        const message = earlyOut 
          ? "Clock-out successful (Early departure recorded)" 
          : "Clock-out successful";
        
        return callback({ success: true, message, todayAttendance });
      }

      default:
        return callback({ success: false, error: "Invalid action type" });
    }
  } catch (err) {
    console.error("AttendanceController Error:", err);
    return callback({ success: false, error: "Internal server error" });
  }
};

export default AttendanceController;