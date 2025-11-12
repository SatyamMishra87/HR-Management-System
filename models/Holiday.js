import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: [true, "Holiday name is required"] },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // optional (if single day)
  description: { type: String },
  assignUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const Holiday = mongoose.model("Holiday", holidaySchema);
export default Holiday;
