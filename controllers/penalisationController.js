import PenalisationPolicy from "../models/PenalisationPolicy.js";
import { verifyToken } from "../utils/tokenVerify.js";

const PenalisationPolicyController = async ({ type, data }, callback) => {
    try {
        const { token } = data;
        if (!token) return callback({ success: false, error: "Token not found" });

        const user = await verifyToken(token);
        if (!user) return callback({ success: false, error: "Invalid token" });

        switch (type) {

            case "createPenalisationPolicy": {
                if (user?.role !== "admin")
                    return callback({ success: false, error: "Only admin can create penalisation policy" });

                const {
                    policyCode,
                    name,
                    description,
                    enableMissingClockOutPenalty,
                    missingClockOutPenaltyType,
                    missingClockOutLeaveType,
                    missingClockOutDayType,
                    enableLatePolicy,
                    lateAllowedPerMonth,
                    lateToHalfDay,
                    lateGraceMinutes,
                    applyInstantPenaltyForLateIn,
                    instantLateInPenaltyType,
                    instantLateInPenaltyAmount,
                    instantLateInLeaveType,
                    instantLateInDayType,
                    enableEarlyOutPolicy,
                    earlyOutGraceMinutes,
                    earlyOutToHalfDay,
                    applyInstantPenaltyForEarlyOut,
                    instantEarlyOutPenaltyType,
                    instantEarlyOutPenaltyAmount,
                    instantEarlyOutLeaveType,
                    instantEarlyOutDayType,
                    enableSalaryDeduction,
                    locationId,
                } = data;

                if (!policyCode?.trim() || !name?.trim()) {
                    return callback({ success: false, error: "Policy code and name are required fields" });
                }

                const existing = await PenalisationPolicy.findOne({ policyCode: policyCode.trim() }).lean();
                if (existing) {
                    return callback({ success: false, error: "Policy code already exists" });
                }

                const newPolicy = new PenalisationPolicy({
                    policyCode: policyCode.trim(),
                    name: name.trim(),
                    description: description?.trim() || "",
                    enableMissingClockOutPenalty: enableMissingClockOutPenalty ?? false,
                    missingClockOutPenaltyType,
                    missingClockOutLeaveType,
                    missingClockOutDayType,
                    enableLatePolicy: enableLatePolicy ?? true,
                    lateAllowedPerMonth: lateAllowedPerMonth ?? 3,
                    lateToHalfDay: lateToHalfDay ?? 2,
                    lateGraceMinutes: lateGraceMinutes ?? 10,
                    applyInstantPenaltyForLateIn: applyInstantPenaltyForLateIn ?? false,
                    instantLateInPenaltyType,
                    instantLateInPenaltyAmount,
                    instantLateInLeaveType,
                    instantLateInDayType,
                    enableEarlyOutPolicy: enableEarlyOutPolicy ?? true,
                    earlyOutGraceMinutes: earlyOutGraceMinutes ?? 10,
                    earlyOutToHalfDay: earlyOutToHalfDay ?? 2,
                    applyInstantPenaltyForEarlyOut: applyInstantPenaltyForEarlyOut ?? false,
                    instantEarlyOutPenaltyType,
                    instantEarlyOutPenaltyAmount,
                    instantEarlyOutLeaveType,
                    instantEarlyOutDayType,
                    enableSalaryDeduction: enableSalaryDeduction ?? true,
                    locationId: locationId || null,
                    updatedBy: user._id,
                });

                const savedPolicy = await newPolicy.save();
                return callback({
                    success: true,
                    message: "Penalisation policy created successfully",
                    data: savedPolicy
                });
            }

            case "getAllPenalisationPolicies": {
                const policies = await PenalisationPolicy.find()
                    .populate("createdBy updatedBy locationId")
                    .sort({ createdAt: -1 })
                    .lean();
                return callback({ success: true, data: policies });
            }

            case "getPenalisationPolicyById": {
                const { id } = data;
                if (!id) return callback({ success: false, error: "Policy ID required" });

                const policy = await PenalisationPolicy.findById(id)
                    .populate("createdBy updatedBy locationId")
                    .lean();
                if (!policy) return callback({ success: false, error: "Policy not found" });

                return callback({ success: true, data: policy });
            }

            case "updatePenalisationPolicy": {
                if (user?.role !== "admin")
                    return callback({ success: false, error: "Only admin can update penalisation policy" });

                const { id, ...updateData } = data;
                if (!id) return callback({ success: false, error: "Policy ID required" });

                // prevent updating policyCode to existing one
                if (updateData.policyCode) {
                    const existing = await PenalisationPolicy.findOne({
                        policyCode: updateData.policyCode.trim(),
                        _id: { $ne: id },
                    }).lean();
                    if (existing)
                        return callback({ success: false, error: "Another policy with this code already exists" });
                }

                const updatedPolicy = await PenalisationPolicy.findByIdAndUpdate(id, updateData, { new: true });
                if (!updatedPolicy)
                    return callback({ success: false, error: "Policy not found or update failed" });

                return callback({
                    success: true,
                    message: "Penalisation policy updated successfully",
                    data: updatedPolicy
                });
            }


            case "deletePenalisationPolicy": {
                if (user?.role !== "admin")
                    return callback({ success: false, error: "Only admin can delete penalisation policy" });

                const { id } = data;
                if (!id) return callback({ success: false, error: "Policy ID required" });

                const deletedPolicy = await PenalisationPolicy.findByIdAndDelete(id);
                if (!deletedPolicy)
                    return callback({ success: false, error: "Policy not found" });

                return callback({
                    success: true,
                    message: "Penalisation policy deleted successfully"
                });
            }

            default:
                return callback({ success: false, error: "Invalid operation type" });
        }

    } catch (error) {
        console.error("PenalisationPolicyController error:", error);
        return callback({ success: false, error: error.message || "Internal server error" });
    }
};

export default PenalisationPolicyController;




// import PenalisationPolicy from "../models/PenalisationPolicy.js";
// import { verifyToken } from "../utils/tokenVerify.js";

// const PenalisationPolicyController = async ({ type, data }, callback) => {
//     try {
//         const { token } = data;
//         if (!token) return callback({ success: false, error: "Token not found" });

//         const user = await verifyToken(token);
//         if (!user) return callback({ success: false, error: "Invalid token" });

//         switch (type) {

//             case "createPenalisationPolicy": {
//                 if (user?.role !== "admin")
//                     return callback({ success: false, error: "Only admin can create PenalisationPolicy" });
//                 const {
//                     policyCode,
//                     name,
//                     description,
//                     enableMissingClockOutPenalty,
//                     missingClockOutPenaltyType,
//                     missingClockOutLeaveType,
//                     missingClockOutDayType,
//                     enableLatePolicy,
//                     lateAllowedPerMonth,
//                     lateToHalfDay,
//                     lateGraceMinutes,
//                     enableEarlyOutPolicy,
//                     earlyOutGraceMinutes,
//                     earlyOutToHalfDay,
//                     enableSalaryDeduction,
//                     locationId
//                 } = data;

//                 if (!policyCode?.trim() || !name?.trim()) {
//                     return callback({ success: false, error: "Policy code and name are required fields" });
//                 }

//                 const existing = await PenalisationPolicy.findOne({ policyCode: policyCode.trim() });
//                 if (existing)
//                     return callback({ success: false, error: "Policy code already exists" });

//                 const newPolicy = new PenalisationPolicy({
//                     policyCode: policyCode,
//                     name: name,
//                     description: description,
//                     enableMissingClockOutPenalty,
//                     missingClockOutPenaltyType,
//                     missingClockOutLeaveType,
//                     missingClockOutDayType,
//                     enableLatePolicy: enableLatePolicy ?? true,
//                     lateAllowedPerMonth: lateAllowedPerMonth ?? 3,
//                     lateToHalfDay: lateToHalfDay ?? 2,
//                     lateGraceMinutes: lateGraceMinutes ?? 10,
//                     enableEarlyOutPolicy: enableEarlyOutPolicy ?? true,
//                     earlyOutGraceMinutes: earlyOutGraceMinutes ?? 10,
//                     earlyOutToHalfDay: earlyOutToHalfDay ?? 2,
//                     enableSalaryDeduction: enableSalaryDeduction ?? true,
//                     locationId: locationId || null,
//                     createdBy: user._id,
//                     updatedBy: user._id,
//                 });

//                 const savedPolicy = await newPolicy.save();
//                 return callback({ success: true, message: "Penalisation policy created successfully", data: savedPolicy });
//             }

//             case "getAllPenalisationPolicies": {
//                 const policies = await PenalisationPolicy.find().populate("createdBy updatedBy locationId");
//                 return callback({ success: true, data: policies });
//             }

//             case "getPenalisationPolicyById": {
//                 const { id } = data;
//                 if (!id) return callback({ success: false, error: "Policy ID required" });

//                 const policy = await PenalisationPolicy.findById(id).populate("createdBy updatedBy locationId");
//                 if (!policy) return callback({ success: false, error: "Policy not found" });

//                 return callback({ success: true, data: policy });
//             }


//             case "updatePenalisationPolicy": {
//                 if (user?.role !== "admin")
//                     return callback({ success: false, error: "Only admin can update PenalisationPolicy" });

//                 const { id, ...updateData } = data;
//                 if (!id) return callback({ success: false, error: "Policy ID required" });

//                 updateData.updatedBy = user._id;
//                 updateData.updatedAt = new Date();

//                 const updatedPolicy = await PenalisationPolicy.findByIdAndUpdate(id, updateData, { new: true });
//                 if (!updatedPolicy)
//                     return callback({ success: false, error: "Policy not found or update failed" });

//                 return callback({ success: true, message: "Penalisation policy updated successfully", data: updatedPolicy });
//             }

//             case "deletePenalisationPolicy": {
//                 if (user?.role !== "admin")
//                     return callback({ success: false, error: "Only admin can delete PenalisationPolicy" });

//                 const { id } = data;
//                 if (!id) return callback({ success: false, error: "Policy ID required" });

//                 const deletedPolicy = await PenalisationPolicy.findByIdAndDelete(id);
//                 if (!deletedPolicy)
//                     return callback({ success: false, error: "Policy not found" });

//                 return callback({ success: true, message: "Penalisation policy deleted successfully" });
//             }

//             default:
//                 return callback({ success: false, error: "Invalid operation type" });
//         }

//     } catch (error) {
//         console.log("PenalisationPolicyController error:", error.message);
//         return callback({ success: false, error: "Internal server error" });
//     }
// };

// export default PenalisationPolicyController;
