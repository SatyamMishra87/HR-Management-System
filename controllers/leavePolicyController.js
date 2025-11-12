import LeavePolicy from "../models/leavePolicy.js";
import User from "../models/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { ENUMS } from "../utils/constants.js";
import LeaveBalanceSheet from "../models/leaveBalanceSheet.js";

const leavePolicyController = async ({ type, data }, callback) => {
    try {
        const { token } = data;
        if (!token) return callback({ success: false, error: "Unauthorized : No token found" });
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decode.id);
        if (!user) return callback({ success: false, error: "User not found" });
        console.log(user);
        switch (type) {

            case "createLeavePolicy": {
                if (user.role !== "admin") return callback({ success: false, error: "Only admin can create Leave Policy" });
                const { leavePolicyName, code, policyType } = data;
                if (!leavePolicyName || !code || !policyType) return callback({ success: false, error: "name  , code  ,policyType is required" });
                if (![ENUMS.leavePolicyType.paidLeave, ENUMS.leavePolicyType.unpaidLeave].includes(policyType))
                    return callback({ success: false, error: "Invalid policyType" });
                console.log(ENUMS.leavePolicyType.paidLeave)
                const existsleavePolicy = await LeavePolicy.findOne({ code: code });
                console.log(existsleavePolicy);
                if (existsleavePolicy) return callback({ success: false, error: "code is already exitst" });

                const newLeavePolicy = new LeavePolicy({
                    leavePolicyName,
                    code,
                    policyType
                });
                await newLeavePolicy.save();
                return callback({ success: true, message: "leave policy created successfully", newLeavePolicy });

            }

            case "assignLeavePolicy": {
                if (user.role !== "admin") return callback({ success: false, error: "Only admin can assign leave Policy" });
                let { leavePolicyId, userId, leaveBalance } = data;
                if (!Array.isArray(userId)) userId = [userId];
                if (!Array.isArray(leavePolicyId)) leavePolicyId = [leavePolicyId];
                console.log(userId, leavePolicyId)
                if (userId.length === 0 || leavePolicyId.length === 0 || !leaveBalance) return callback({ success: false, error: "userId  leavePolicyId and leaveBalance is required" });
                const leavePolicy = await LeavePolicy.find({ _id: { $in: leavePolicyId } });
                if (!leavePolicy || leavePolicy.length === 0) return callback({ success: false, error: "leave policy not found" });

                const users = await User.find({ _id: { $in: userId } });
                if (!users.length)
                    return callback({ success: false, error: "User not found" });
                const assignedUsers = [];
                for (const u of users) {
                    for (const lpId of leavePolicyId) {
                        await User.findByIdAndUpdate(u._id, { $addToSet: { assignedLeavePolicy: lpId } });
                        await LeavePolicy.findByIdAndUpdate(lpId, { $addToSet: { assignUsers: u._id } });
                        const exist = await LeaveBalanceSheet.findOne({ userId: u._id, leavePolicyId: lpId });
                        if (!exist) {
                            await LeaveBalanceSheet.create({
                                userId: u._id,
                                leavePolicyId: lpId,
                                leaveBalance,
                                leaveRemaining: leaveBalance
                            });                                                     
                        }
                    }
                    assignedUsers.push(u._id.toString());
                }
                return callback({ success: true, message: "Leave policy assigned and balance sheet created", assignedUsers });

            }

            default:
                return callback({ success: false, error: "Invalid action type" });
        }
    } catch (error) {
        console.error("leavePolicyController error", error);
        return callback({ success: false, error: "Something went wrong", details: error.message });
    }
}

export default leavePolicyController; 
