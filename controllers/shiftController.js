import jwt from "jsonwebtoken";
import Shift from "../models/Shift.js";
import User from "../models/auth.js";
import dotenv from "dotenv";
dotenv.config();

const shiftController = async ({ type, data }, callback) => {
  try {
    const { token } = data;
    if (!token) return callback({ success: false, error: "Unauthorized: No token provided" });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return callback({ success: false, error: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return callback({ success: false, error: "User not found" });

    const isAdmin = user.role === "admin";           

    switch (type) {
      case "create": {
        if (!isAdmin) {
          return callback({ success: false, error: "Only admin can create shifts" });
        }

        const { name, code, fullDayHrs, halfDayHrs, days } = data;

        if (!name || !code || !fullDayHrs || !halfDayHrs || !days) {
          return callback({ success: false, error: "All shift fields are required" });
        }

        const normalizedCode = code.toUpperCase();

        const existing = await Shift.findOne({ code: normalizedCode });
        if (existing) return callback({ success: false, error: "Shift code already exists" });

        const shift = await Shift.create({
          name,
          code: normalizedCode,
          fullDayHrs,
          halfDayHrs,
          days,
          assignUsers: [],
        });

        return callback({ success: true, message: "Shift created successfully", shift });
      }

      case "read": {
        const shifts = await Shift.find().populate("assignUsers", "name email");
        return callback({ success: true, shifts });
      }
      case "assignShift": {
        if (!isAdmin) return callback({ success: false, error: "Only admin can assign shift" });

        const { userIds, shiftId } = data; 
        if (!userIds || !shiftId) return callback({ success: false, error: "userIds and shiftId are required" });

        const shift = await Shift.findById(shiftId);
        if (!shift) return callback({ success: false, error: "Shift not found" });

        const ids = Array.isArray(userIds) ? userIds : [userIds];

        const assignedUsers = [];
        const skippedUsers = [];

        for (let uId of ids) {
          const user = await User.findById(uId);
          if (!user) {
            skippedUsers.push(uId);
            continue;
          }

          // Remove user from old shift if assigned
          if (user.assignedShift && !user.assignedShift.equals(shift._id)) {
            await Shift.findByIdAndUpdate(user.assignedShift, { $pull: { assignUsers: user._id } });
          }
      
          if (!user.assignedShift || !user.assignedShift.equals(shift._id)) {
            user.assignedShift = shift._id;
            await user.save();
          }

          if (!shift.assignUsers.some(u => u.equals(user._id))) {
            shift.assignUsers.push(user._id);
          }

          assignedUsers.push(user);
        }

        await shift.save();

        return callback({
          success: true,
          message: "Shift assignment completed",
          assignedUsers,
          skippedUsers, 
          shift
        });
      }

                                                     
      case "unassignShift": {
        if (!isAdmin) return callback({ success: false, error: "Only admin can unassign shifts" });

        const { userId } = data;
        if (!userId) return callback({ success: false, error: "userId required" });                                                          

        const user = await User.findById(userId);
        if (!user) return callback({ success: false, error: "User not found" });
           

        if (!user.assignedShift) return callback({ success: false, error: "User is not assigned to any shift" });
        const shiftId = user.assignedShift;
        console.log(shiftId)
        await Shift.findByIdAndUpdate(
          shiftId,
          { $pull: { assignUsers: user._id } },
          { new: true }
        );
             
        user.assignedShift = null;
        await user.save();

        return callback({ success: true, message: "Shift unassigned successfully", user: user });
      }

      default:
        return callback({ success: false, error: "Invalid action type" });
    }
  } catch (err) {
    console.error("ShiftController Error:", err);
    return callback({ success: false, error: "Something went wrong", details: err.message });
  }
};

export default shiftController;




