import Location from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();
import { verifyToken } from "../utils/tokenVerify.js";


const locationController = async ({ type, data }, callback) => {
    const { token } = data;
     const user = await verifyToken(token);
     console.log("user",user)
     if(!user) return callback({success :false , error : "User not found"})
    try {
        switch (type) {
            case "createLocation": {
                if (user.role !== 'admin') return callback({ success: false, error: "only admin can create Location" });

                const {cityName} = data;

                if (!cityName )
                    return callback({ success: false, error: "fields are required" });

                const location =  await Location.create({
                    cityName,
                })

                return callback({success :true , message : location});
            }
        }
    } catch (error) {
        console.error("locationController Error", error.message);
        return callback({ success: false, message: "Internal Server Error" })
    }
}

export default locationController;