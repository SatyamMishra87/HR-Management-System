import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, sparse: true }, // <--- sparse added
    fullDayHrs: { type: Number, required: true },
    halfDayHrs: { type: Number, required: true },
    assignUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    days: {
      type: Map,
      of: {
        start: { type: String },
        end: { type: String  },
         dayStatus: {
            type: Number,
            enum: [
              ENUMS.DAY_STATUS.WORKING,
              ENUMS.DAY_STATUS.WEEKEND,
              ENUMS.DAY_STATUS.FIRSTHALF,
              ENUMS.DAY_STATUS.SECONDHALF 
            ],
            default: ENUMS.DAY_STATUS.WORKING,
          },
      },
      required: true,
    },

  },
  { timestamps: true }
);

const Shift = mongoose.model("Shift", shiftSchema);
export default Shift;
