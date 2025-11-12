import PaySchedule from "../models/paySchedule.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/auth.js";
import Location from "../models/location.js";


const payScheduleController = async ({ type, data }, callback) => {
    const { token } = data;
    if (!token) return callback({ success: false, Error: "Token is required" });
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decode.id);
    if (!user) return callback({ success: false, error: "User not found" });
    console.log("user", user)
    try {
        switch (type) {
            case "createPaySchedule": {
                if (user.role !== 'admin') return callback({ success: false, error: "only admin can create paySchedule" });

                const { payForWeekends, payForHolidays, earlyOutGraceMinutes, payForEarlyOutWithinGrace ,locationId } = data;

                if (!payForWeekends || !payForHolidays || !earlyOutGraceMinutes || !payForEarlyOutWithinGrace , !locationId)
                    return callback({ success: false, error: "fields are required" });

                const location = await Location.findById(locationId);
                if(!location) return callback({success:false ,error : "location not found"})

                const paySchedule =  await PaySchedule.create({
                    payForWeekends,
                    payForHolidays,
                    earlyOutGraceMinutes,
                    payForEarlyOutWithinGrace,
                    locationId
                })

                return callback({success :false , message : paySchedule});

            }


        }


    } catch (error) {
        console.error("payScheduleController Error", error.message);
        return callback({ success: false, message: "Internal Server Error" })
    }
}

export default payScheduleController;