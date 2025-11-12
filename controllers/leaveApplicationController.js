import LeavePolicy from "../models/leavePolicy.js";
import User from "../models/auth.js";
import LeaveApplication from "../models/leaveApplication.js";
import LeaveBalanceSheet from "../models/leaveBalanceSheet.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { ENUMS } from "../utils/constants.js";
import { istStartOfDayToUTC, istEndOfDayToUTC} from "../utils/time.js"

const leaveApplicationController = async ({ type, data }, callback) => {
  try {
    const { token } = data;
    if (!token) return callback({ success: false, error: "Unauthorized : No token found" });

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decode.id);
    if (!user) return callback({ success: false, error: "user not found" });
    console.log(user)
    switch (type) {

      case "createLeaveApplication": {
        const { leavePolicyId, startDate, endDate, leaveDays } = data;
        console.log(leavePolicyId, startDate, endDate, leaveDays)

        if (!leavePolicyId || !startDate || !leaveDays || !Array.isArray(leaveDays) || leaveDays.length === 0)
          return callback({ success: false, error: "LeaveId , startDate and leaveDays are required" });

        for (const d of leaveDays) {
          if (!d.date || d.leaveType === undefined)
            return callback({ success: false, error: "Each leaveDay must have date and leaveType" });
          if (![ENUMS.leaveType.FULL, ENUMS.leaveType.FIRSTHALF, ENUMS.leaveType.SECONDHALF].includes(d.leaveType))
            return callback({ success: false, error: "Invalid leaveType detected" });
        }

        const leavePolicy = await LeavePolicy.findById(leavePolicyId);
        if (!leavePolicy) return callback({ success: false, error: "leavePolicy not found" });

        const assignedPolicies = await LeaveBalanceSheet.find({ userId: user._id });
        const assignedPolicyIds = assignedPolicies.map(p => p.leavePolicyId.toString());
        if (!assignedPolicyIds.includes(leavePolicyId)) {
          return callback({ success: false, error: "You are not assigned to this leave policy" });
        }

        const balance = await LeaveBalanceSheet.findOne({ userId: user._id, leavePolicyId });
        if (!balance) return callback({ success: false, error: "Leave balance sheet not found" });

        const start = istStartOfDayToUTC(startDate);
        const end = endDate ? istEndOfDayToUTC(endDate) : istEndOfDayToUTC(startDate);

        let totalDuration = 0;
        const leaveDaysUTC = leaveDays.map(d => {
          const dayUTC = istStartOfDayToUTC(d.date);
          console.log("dayutc",dayUTC);
          const leaveType = d.leaveType;
          totalDuration += leaveType === ENUMS.leaveType.FULL ? 1 : 0.5;
          return { date: dayUTC, leaveType };
        });

        if (totalDuration > balance.leaveRemaining) {
          return callback({ success: false, error: `Insufficient leave balance. Requested: ${totalDuration}, Remaining: ${balance.leaveRemaining}` });
        }

        const leaveApplication = await LeaveApplication.create({
          userId: user._id,
          leavePolicyId,
          startDate: start,
          endDate: end,
          leaveDays: leaveDaysUTC,
          totalDuration,
        });

        return callback({
          success: true,
          message: "Leave application created successfully",
          leaveApplication,

        });

      }

      case "approvLeave": {
        const { applicationIds, action } = data;

        if (!applicationIds?.length)
          return callback({ success: false, error: "applicationIds required" });

        if (user.role !== "admin")
          return callback({ success: false, error: "Only admin can approve/reject/revoke" });

        const ids = Array.isArray(applicationIds) ? applicationIds : [applicationIds];
        const results = [];

        for (const appId of ids) {
          const application = await LeaveApplication.findById(appId);
          if (!application) {
            results.push({ applicationId: appId, success: false, error: "Application not found" });
            continue;
          }

          const balanceSheet = await LeaveBalanceSheet.findOne({
            userId: application.userId,
            leavePolicyId: application.leavePolicyId
          });

          if (!balanceSheet) {
            results.push({ applicationId: appId, success: false, error: "Leave balance sheet not found" });
            continue;
          }

          switch (action) {
            case "approve":
              if (application.status !== ENUMS.statusType.PENDING) {
                results.push({ applicationId: appId, success: false, error: "Only pending applications can be approved" });
                continue;
              }
              if (application.totalDuration > balanceSheet.leaveRemaining) {
                results.push({ applicationId: appId, success: false, error: `Insufficient remaining balance. Required: ${application.totalDuration}, Available: ${balanceSheet.leaveRemaining}` });
                continue;
              }
              balanceSheet.leaveBooked += application.totalDuration;
              balanceSheet.leaveRemaining -= application.totalDuration;
              application.status = ENUMS.statusType.APPROVED;
              break;

            case "reject":
              if (application.status !== ENUMS.statusType.PENDING) {
                results.push({ applicationId: appId, success: false, error: "Only pending applications can be rejected" });
                continue;
              }
              application.status = ENUMS.statusType.REJECT;
              break;

            case "revoke":
              if (application.status !== ENUMS.statusType.APPROVED) {
                results.push({ applicationId: appId, success: false, error: "Only approved applications can be revoked" });
                continue;
              }
              balanceSheet.leaveBooked -= application.totalDuration;
              balanceSheet.leaveRemaining += application.totalDuration;
              application.status = ENUMS.statusType.REVOKED;
              break;

            default:
              results.push({ applicationId: appId, success: false, error: "Invalid action" });
              continue;
          }

          await Promise.all([balanceSheet.save(), application.save()]);

          results.push({
            applicationId: appId,
            success: true,
            message: `Leave ${action}d successfully`
          });
        }

        return callback({
          success: true,
          message: `Processed ${results.length} leave application(s)`,                  
          results
        });
      }

      default:
        return callback({ success: false, error: "Invalid action type" });
    }
  } catch (error) {
    console.error("leaveApplicationController error", error);
    return callback({ success: false, error: "Something went wrong", details: error.message });
  }
}

export default leaveApplicationController;
