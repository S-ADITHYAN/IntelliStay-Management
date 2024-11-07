const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
    roomno: String,
    roomtype:String,
    status:String, 
    rate: Number,
    description:String,
    images:[String],
    allowedAdults: { type: Number, required: true, min: 1 }, // New field for allowed adults
    allowedChildren: { type: Number, required: true, min: 0 }, // New field for allowed children
    amenities: { type: String, required: true }, // New field for amenities

},{timestamps:true});

 const RoomModel = mongoose.model("room",RoomSchema);
 module.exports=RoomModel;