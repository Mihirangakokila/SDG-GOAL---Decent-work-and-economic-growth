import mongoose from "mongoose"; 

const internshipSchema = new mongoose.Schema({
  tittle : {
    type : String,
    required :true
  },
  description :{
    type : String,
    required: true
  },
  requiredSkills : [
    {
      type : String
    }
  ],
  requiredEducation : {
    type : String 
  },
  location : {
    type : String
  },
  duration : {
    type : String
  },
  status :{
    type: String,
    enum :["Draft","Active","Closed"],
    default : "Draft"
  },
  organizationId :{
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : true
  },
  totalapplicants : {
    type : Number,
    default : 0 
  },
  acceptedCount :{
    type : Number,
    default : 0
  },
  },{
    timestamps : true
  }
);

export default mongoose.model("Internship", internshipSchema);