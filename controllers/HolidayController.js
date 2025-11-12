import Holiday from "../models/Holiday.js";
import User from "../models/auth.js";
import { istStartOfDayToUTC, istEndOfDayToUTC } from "../utils/time.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const HolidayController = async ({ type, data }, callback) => {
    try {
        const { token } = data;
        if (!token) return callback({ success: false, error: "Unauthorized: Token Not Found" });

        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decode.id);
        if (!user) return callback({ success: false, error: "User Not Found" });

        switch (type) {

            // CREATE HOLIDAY (single or range)
            case "createHoliday": {
                if (user.role !== "admin")
                    return callback({ success: false, error: "Only Admin can create Holiday" });

                const { name, startDate, endDate, description } = data;
                if (!name || !startDate)
                    return callback({ success: false, error: "name and startDate are required" });

                const start = istStartOfDayToUTC(startDate);
                const end = endDate ? istEndOfDayToUTC(endDate) : istEndOfDayToUTC(startDate);

                if (end < start)
                    return callback({ success: false, error: "endDate cannot be before startDate" });

                // Check overlapping holidays
                const overlap = await Holiday.findOne({
                    $or: [
                        { startDate: { $lte: end }, endDate: { $gte: start } }
                    ]
                });
                if (overlap)
                    return callback({ success: false, error: "A holiday already exists in this range" });

                const holiday = await Holiday.create({
                    name,
                    startDate: start,
                    endDate: end,
                    description: description || "",
                    assignUsers: []
                });

                return callback({ success: true, message: "Holiday created successfully", holiday });
            }

            // ASSIGN/UNASSIGN HOLIDAY
            case "assignHoliday": {
                if (user.role !== "admin")
                    return callback({ success: false, error: "Only Admin can assign Holiday" });

                let { holidayId, userId, unassignedUserId } = data;
                if (!holidayId) return callback({ success: false, error: "holidayId is required" });

                if (!Array.isArray(userId)) userId = [userId].filter(Boolean);
                if (!Array.isArray(unassignedUserId)) unassignedUserId = [unassignedUserId].filter(Boolean);

                const holiday = await Holiday.findById(holidayId);
                if (!holiday) return callback({ success: false, error: "Holiday not found" });  

                const assignedUsers = [];
                const unassignedUsers = [];

                // Assign users
                if (userId.length > 0) {
                    const users = await User.find({ _id: { $in: userId } });
                    for (const u of users) {
                        if (!u.assignedHolidays?.includes(holidayId)) {
                            u.assignedHolidays = [...(u.assignedHolidays || []), holidayId];
                            await u.save();
                            await Holiday.findByIdAndUpdate(holidayId, { $addToSet: { assignUsers: u._id } });
                            assignedUsers.push(u._id.toString());
                        }
                    }
                }

                // Unassign users
                if (unassignedUserId.length > 0) {
                    const users = await User.find({ _id: { $in: unassignedUserId } });
                    for (const u of users) {
                        if (u.assignedHolidays?.includes(holidayId)) {
                            u.assignedHolidays = u.assignedHolidays.filter(id => id.toString() !== holidayId);
                            await u.save();
                            await Holiday.findByIdAndUpdate(holidayId, { $pull: { assignUsers: u._id } });
                            unassignedUsers.push(u._id.toString());
                        }
                    }
                }

                return callback({
                    success: true,
                    message: "Holiday assignment updated",
                    assignedUsers,
                    unassignedUsers
                });
            }

            case "getHolidays": {
                const holidays = await Holiday.find().sort({ startDate: 1 });
                return callback({ success: true, holidays });
            }

            case "deleteHoliday": {
                if (user.role !== "admin")
                    return callback({ success: false, error: "Only Admin can delete Holiday" });

                const { holidayId } = data;
                if (!holidayId) return callback({ success: false, error: "holidayId is required" });

                await Holiday.findByIdAndDelete(holidayId);
                await User.updateMany({}, { $pull: { assignedHolidays: holidayId } });

                return callback({ success: true, message: "Holiday deleted successfully" });
            }

            default:
                return callback({ success: false, error: "Invalid action type" });
        }
    } catch (err) {
        console.error("HolidayController Error:", err);
        return callback({ success: false, error: err.message });
    }
};

export default HolidayController;
