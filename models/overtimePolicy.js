import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const overtimePolicySchema = new mongoose.Schema({
    overtimePolicyName: { type: String, unique: true, required: true },
    payFactorType: { type: Number, enum: [ENUMS.payFactorType.MULTIPLIER , ENUMS.payFactorType.FIXED_TOTAL], required: true, default: ENUMS.payFactorType.MULTIPLIER },
    holidayMultiplier: { type: Number, default: 1.5 },
    weekendMultiplier: { type: Number, default: 1 },
    workingMultiplier: { type: Number, default: 0.5 },
    fixedTotal: { type: Number, default: 0 },
    applicableTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const OvertimePolicy =  mongoose.models.OvertimePolicy || mongoose.model("OvertimePolicy", overtimePolicySchema);
export default OvertimePolicy;
