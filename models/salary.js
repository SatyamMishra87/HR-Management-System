import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const salarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    frequencyType: {
        type: String,
        enum: [ENUMS.salaryFrequency.MONTHLY, ENUMS.salaryFrequency.WEEKLY, ENUMS.salaryFrequency.DAILY, ENUMS.salaryFrequency.HOURLY],
        default: ENUMS.salaryFrequency.MONTHLY,
    },
    salary: { type: Number, required: true  ,default : 0},
    status: {
        type: Number,
        enum: [ENUMS.statusType.PENDING, ENUMS.statusType.APPROVED, ENUMS.statusType.REJECT, ENUMS.statusType.REVOKED],
        default: ENUMS.statusType.PENDING,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.models.Salary || mongoose.model("Salary", salarySchema);






//medicalAllowance: { type: Number, default: 0 },
// Final Computed Fields
//   grossEarnings: { type: Number, default: 0 },
//   totalDeductions: { type: Number, default: 0 },
//   netPay: { type: Number, default: 0 },
