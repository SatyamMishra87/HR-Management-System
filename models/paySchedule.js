import mongoose from "mongoose";

const payScheduleSchme = new mongoose.Schema({
    payForWeekends : {type  : Boolean , default :false , required : true},
    payForHolidays : {type  : Boolean , default :false , required : true},
    earlyOutGraceMinutes :{type : Number , default : 10},
    payForEarlyOutWithinGrace : {type  : Boolean , default :false , required : true},
    payForExtraTime : {type : Boolean , default:false , required :true},
    locationId : {type : mongoose.Schema.Types.ObjectId , ref : "Location" , required : true}
})

export default mongoose.model("PaySchedule" , payScheduleSchme);