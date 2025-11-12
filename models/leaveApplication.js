import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const leaveDaySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    leaveType: {
        type: Number,
        enum: [ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF, ENUMS.leaveType.FULL],
        required: true,
    },
}, { _id: false });

const leaveApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leavePolicyId: { type: mongoose.Schema.Types.ObjectId, ref: "LeavePolicy", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaveDays: { type: [leaveDaySchema], required: true },
    totalDuration: { type: Number, required: true, default: 0 },
    status: {
        type: Number,
        enum: [ENUMS.statusType.PENDING, ENUMS.statusType.APPROVED, ENUMS.statusType.REJECT ,ENUMS.statusType.REVOKED],
        default: ENUMS.statusType.PENDING,
    },
    appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });


const LeaveApplication = mongoose.model("LeaveApplication", leaveApplicationSchema);
export default LeaveApplication;
