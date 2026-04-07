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
  location: {
  type: String
},
coordinates: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point"
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: undefined
  }
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
  viewCount : {
    type : Number,
    default : 0
  }
  },{
    timestamps : true
  }
);

internshipSchema.index({ coordinates: "2dsphere" });

export default mongoose.model("Internship", internshipSchema);