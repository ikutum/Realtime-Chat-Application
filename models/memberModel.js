const { StreamDescription } = require("mongodb");
const mongoose  = require("mongoose");

const memberSchema =new mongoose.Schema({
group_id :{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Group'
},
user_id :{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
}

},
{timestamps:true}
);
const Member = mongoose.model('Member',memberSchema);
 
module.exports =Member;