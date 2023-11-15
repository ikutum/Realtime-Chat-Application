const mongoose  = require("mongoose");
//const {isEmail} = require('validator');
const bcrypt = require('bcrypt');
const userSchema =new mongoose.Schema({
    username:{
        type: String,
        unique: true,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required:[true, 'Email is required'],
     //   validate:[isEmail, 'please enter valid email']
    },
   image:{
     type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        unique: true,
        required: true
    },
    is_online:{
        type: String,
        unique: false,
        default: '0'
    }
},
{timestamps:true}
);
const User = mongoose.model('User',userSchema);

module.exports =User;
