import mongoose from "mongoose";
const locationSchema = new mongoose.Schema({
    cityName :{type : String , required : true}
});

export default mongoose.model("Location" , locationSchema);