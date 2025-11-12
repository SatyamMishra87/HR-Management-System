import mongoose from "mongoose";
import { Schema } from "mongoose";
import { ENUMS } from "../utils/constants.js";

const PenalisationPolicySchema = new Schema({
    policyCode: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: { type: String },
    isDefault: { type: Boolean, default: false },
    
    // Missing Clock Out Policy
    enableMissingClockOutPenalty: { type: Boolean, default: false },
    missingClockOutPenaltyType: {
        type: Number,
        enum: [ENUMS.missingClockOutPenaltyType.AMOUNT, ENUMS.missingClockOutPenaltyType.LEAVE],
        default: ENUMS.missingClockOutPenaltyType.LEAVE
    },
    missingClockOutPenaltyAmount: { type: Number, default: 0 },
    missingClockOutLeaveType: {
        type: Number,
        enum: [ENUMS.leavePolicyType.paidLeave, ENUMS.leavePolicyType.unpaidLeave],
        default: ENUMS.leavePolicyType.unpaidLeave
    },
    missingClockOutDayType: {
        type: Number,
        enum: [ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF, ENUMS.leaveType.FULL],
        default: ENUMS.leaveType.SECONDHALF
    },

    penaltyRuleForLateWithEarlyOut: {
        type: Number,
        enum: [ENUMS.penaltyRuleType.APPLY_FIRST_HIT, ENUMS.penaltyRuleType.LATE_IN, ENUMS.penaltyRuleType.EARLY_OUT, ENUMS.penaltyRuleType.BOTH],
        default: ENUMS.penaltyRuleType.BOTH
    },

    // Late In Policy
    enableLatePolicy: { type: Boolean, default: true },
    lateAllowedPerMonth: { type: Number, default: 3 },
    lateToHalfDay: { type: Number, default: 2 },
    lateGraceMinutes: { type: Number, default: 10 },

    
    // Instant Penalty for Late In
    applyInstantPenaltyForLateIn: { type: Boolean, default: false },
    instantLateInPenaltyType: {
        type: Number,
        enum: [ENUMS.instantPenaltyType.AMOUNT, ENUMS.instantPenaltyType.LEAVE],
        default: ENUMS.instantPenaltyType.LEAVE
    },
    instantLateInPenaltyAmount: { type: Number, default: 0 },
    instantLateInLeaveType: {
        type: Number,
        enum: [ENUMS.leavePolicyType.paidLeave, ENUMS.leavePolicyType.unpaidLeave],
        default: ENUMS.leavePolicyType.unpaidLeave
    },
    instantLateInDayType: {
        type: Number,
        enum: [ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF, ENUMS.leaveType.FULL],
        default: ENUMS.leaveType.SECONDHALF
    },

    // Early Out Policy
    enableEarlyOutPolicy: { type: Boolean, default: true },
    earlyOutGraceMinutes: { type: Number, default: 10 },
    earlyOutToHalfDay: { type: Number, default: 2 },

    applyInstantPenaltyForEarlyOut: { type: Boolean, default: false },
    instantEarlyOutPenaltyType: {
        type: Number,
        enum: [ENUMS.instantPenaltyType.AMOUNT, ENUMS.instantPenaltyType.LEAVE],
        default: ENUMS.instantPenaltyType.LEAVE
    },
    instantEarlyOutPenaltyAmount: { type: Number, default: 0 },
    instantEarlyOutLeaveType: {
        type: Number,
        enum: [ENUMS.leavePolicyType.paidLeave, ENUMS.leavePolicyType.unpaidLeave],
        default: ENUMS.leavePolicyType.unpaidLeave
    },
    instantEarlyOutDayType: {
        type: Number,
        enum: [ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF, ENUMS.leaveType.FULL],
        default: ENUMS.leaveType.SECONDHALF
    },
  

    enableSalaryDeduction: { type: Boolean, default: true },

 
    locationId: { type: Schema.Types.ObjectId, ref: "Location" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("PenalisationPolicy", PenalisationPolicySchema);


















// import mongoose from "mongoose";
// import { Schema } from "mongoose";
// import { ENUMS } from "../utils/constants.js";

// const PenalisationPolicySchema = new Schema({
//     policyCode: { type: String, unique: true, required: true },
//     name: { type: String, required: true },
//     description: { type: String },
//     isDefault: { type: Boolean, default: false },
//     enableMissingClockOutPenalty: { type: Boolean, default: false },

//     missingClockOutPenaltyType: {
//         type: Number,
//         enum: [ENUMS.missingClockOutPenaltyType.AMOUNT, ENUMS.missingClockOutPenaltyType.LEAVE], //A -1 l - 2
//         default: ENUMS.missingClockOutPenaltyType.LEAVE
//     },

//     missingClockOutPenaltyAmount: {
//         type: Number, 
//         default: 0
//     },

//     missingClockOutLeaveType: {
//         type: Number,
//         enum: [ENUMS.leavePolicyType.paidLeave, ENUMS.leavePolicyType.unpaidLeave], // p-1 u-2
//         default: ENUMS.leavePolicyType.unpaidLeave
//     },

//     missingClockOutDayType: {
//         type: Number,
//         enum: [ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF, ENUMS.leaveType.FULL], // full - 1 , firsthalf - 2 , secondhlaf - 3
//         default: ENUMS.leaveType.SECONDHALF
//     },

//     enableLatePolicy: { type: Boolean, default: true },
//     lateAllowedPerMonth: { type: Number, default: 3 },
//     lateToHalfDay: { type: Number, default: 2 },
//     lateGraceMinutes: { type: Number, default: 10 },


//     enableEarlyOutPolicy: { type: Boolean, default: true },
//     earlyOutGraceMinutes: { type: Number, default: 10 },
//     earlyOutToHalfDay: { type: Number, default: 2 },

//     enableSalaryDeduction: { type: Boolean, default: true },

//     locationId: { type: Schema.Types.ObjectId, ref: "Location" },
//     createdBy: { type: Schema.Types.ObjectId, ref: "User" },
//     updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
// }, { timestamps: true });

// export default mongoose.model("PenalisationPolicy", PenalisationPolicySchema);


