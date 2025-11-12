import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const attendanceLogSchema = new mongoose.Schema(
  {
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    type: { type: Number, enum : [ENUMS.LOG_TYPE.WORK , ENUMS.LOG_TYPE.BREAK],required: true }, // 1 = Work, 2 = Break

    inTime: { type: Date },   // clockIn / breakIn
    outTime: { type: Date },  // clockOut / breakOut

    workDuration: { type: Number },  // seconds
    reason: { type: String },        // break reason
    breakDuration: { type: Number }, 
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceLog", attendanceLogSchema);
