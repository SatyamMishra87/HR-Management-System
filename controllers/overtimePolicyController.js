import OvertimePolicy from "../models/overTimePolicy.js";
import User from "../models/auth.js";
import jwt from "jsonwebtoken";
import { ENUMS } from "../utils/constants.js";
import dotenv from "dotenv";
dotenv.config();

const overtimePolicyController = async ({ type, data }, callback) => {
    try {
        const { token } = data;
        if (!token) callback({ success: false, error: "Unauthorized : Token Not Found" });
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(decode);
        const user = await User.findById(decode.id);
        if (!user) callback({ success: false, error: "user not found" });
        console.log(user);
        switch (type) {
            case "createOverTimePolicy": {
                if (user?.role !== "admin") return callback({ success: false, error: "only admin can create overtime policy" });
                const { overtimePolicyName, payFactorType, holidayMultiplier, weekendMultiplier, workingMultiplier, fixedTotal } = data;
                if (!overtimePolicyName || !payFactorType)
                    return callback({ success: false, error: "policy name and payFactorType are required" });
                if (payFactorType === ENUMS.payFactorType.MULTIPLIER) {
                    if (!holidayMultiplier || !weekendMultiplier || !workingMultiplier)
                        return callback({ success: false, error: "holidayMultiplier is required for MULTIPLIER type" });
                }
                else if (payFactorType === ENUMS.payFactorType.FIXED_TOTAL) {
                    if (!fixedTotal)
                        return callback({ success: false, error: "fixedTotal is required for FIXED_TOTAL type" });
                }

                const overtimepolicy = await OvertimePolicy.create({
                    overtimePolicyName,
                    payFactorType,
                    holidayMultiplier: payFactorType === ENUMS.payFactorType.MULTIPLIER ? holidayMultiplier : undefined,
                    weekendMultiplier: payFactorType === ENUMS.payFactorType.MULTIPLIER ? (weekendMultiplier ?? 1) : undefined,
                    workingMultiplier: payFactorType === ENUMS.payFactorType.MULTIPLIER ? (workingMultiplier ?? 0.5) : undefined,
                    fixedTotal: payFactorType === ENUMS.payFactorType.FIXED_TOTAL ? fixedTotal : undefined,
                    createdBy: user._id
                });

                return callback({ success: true, message: "Over Time Policy Created Succcessfully ", overtimepolicy })
            }

            case "assignOverTimePolicy": {
                if (user?.role !== "admin") return callback({ success: false, error: "only ad   min can create overtime policy" });

                let { OTId, userId } = data;
                if (!OTId || !userId) return callback({ success: false, error: "OTId and userId is required" });

                if (!Array.isArray(userId)) userId = [userId];
                console.log(userId);

                const overtimepolicy = await OvertimePolicy.findById(OTId);
                if (!overtimepolicy) return callback({ success: false, error: 'over time policy not found' });

                const assignedUsers = [];
                if (userId.length > 0) {
                    const users = await User.find({ _id: { $in: userId } });
                    console.log(users)
                    if (!users || users.length === 0) return callback({ success: false, error: "user not found" });
                    for (let u of users) {
                        if (u?.assignedOvertimePolicy && u.assignedOvertimePolicy.equals(OTId)) {
                            continue;
                            // return callback({ success: false, error: "over time policy already assigned " })
                        }
                        if (u?.assignedOvertimePolicy && !u.assignedOvertimePolicy.equals(OTId)) {
                            await OvertimePolicy.findByIdAndUpdate(
                                u.assignedOvertimePolicy,

                                { $pull: { applicableTo: u._id } }
                            );
                        }
                        u.assignedOvertimePolicy = OTId;
                        await u.save();

                        await OvertimePolicy.findByIdAndUpdate(OTId, { $addToSet: { applicableTo: u._id } });
                        assignedUsers.push(u._id.toString());
                    }
                }

                return callback({ success: true, message: "overtime policy assigned successfully ", assignedUsers })

            }

            case "unassignOverTimePolicy": {
                if (user?.role !== "admin")
                    return callback({ success: false, error: "Only admin can unassign overtime policy" });

                let { OTId, userId } = data;
                if (!OTId || !userId)
                    return callback({ success: false, error: "OTId and userId is required" });

                if (!Array.isArray(userId)) userId = [userId];

                const overtimePolicy = await OvertimePolicy.findById(OTId);
                if (!overtimePolicy)
                    return callback({ success: false, error: "Overtime policy not found" });

                const users = await User.find({ _id: { $in: userId } });
                if (!users || users.length === 0)
                    return callback({ success: false, error: "User not found" });

                const unassignedUsers = [];

                for (let u of users) {
                    if (!u.assignedOvertimePolicy || !u.assignedOvertimePolicy.equals(OTId)) {
                        continue;
                    }
                    u.assignedOvertimePolicy = null;
                    await u.save();

                    await OvertimePolicy.findByIdAndUpdate(
                        OTId,
                        { $pull: { applicableTo: u._id } }
                    );

                    unassignedUsers.push(u._id.toString());
                }
                return callback({
                    success: true,
                    message: "Overtime policy unassigned successfully",
                    unassignedUsers,
                });
            }
            default:
                return callback({ success: false, error: "Invalid  action type" });

        }

    } catch (err) {
        console.error("OvettimePolicyController Error:", err);
        return callback({ success: false, error: "Internal server error" , details: err.message});
    }
}

export default overtimePolicyController
