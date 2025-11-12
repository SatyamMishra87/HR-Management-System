import mongoose from "mongoose";
const leaveBalanceSheetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    leavePolicyId: { type: mongoose.Schema.Types.ObjectId, ref: "LeavePolicy" },
    leaveBalance: { type: Number, required: true, default: 10 },
    leaveBooked: { type: Number, default: 0 },
    leaveRemaining: { type: Number, required: true }

});
const LeaveBalanceSheet = mongoose.model("LeaveBalanceSheet", leaveBalanceSheetSchema);
export default LeaveBalanceSheet;