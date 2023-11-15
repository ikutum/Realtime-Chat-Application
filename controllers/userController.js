//const session = require('express-session');
const User = require ('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
//var objectIdInstance = new ObjectId();
const saltRounds = 10;

const multer = require('multer');
const registerLoad = async(req, res)=>{
    try {
   res.render('register');  
    } catch (error) {
        console.log(error.message);
    }
}

const register = async(req, res)=>{
    try {
        const userPassword = req.body.password;
        
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(userPassword, salt);
      //  req.session.user = user;
        const user = new User({
            username: req.body.username,
            email: req.body.email,
           image: 'images/' + req.file.filename,
            password: hashedPassword
            
        });
           await user.save();
           req.session.user = user;
           res.render('register', {message: 'You have been register'});   
           
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const loadLogin = async(req,res) =>{
    try {
        
        res.render('login')
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login page loading failed' });
    }
}

const login = async(req,res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        
        const userData = await User.findOne({ email:email });
        if (userData) {

         const passwordMatch = await bcrypt.compare(password, userData.password);
    if (passwordMatch) {
         req.session.user = userData;
         res.cookie('user', JSON.stringify(userData));
         res.redirect('/dashboard'); 
} else {
         res.render('login', {message: 'Email  is Incorrect'});
}
        } else {
         res.render('login', {message: 'Password is Incorrect'}); 
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
}

const logout = async(req,res) =>{
    try {

        req.session.destroy();
        res.clearCookie('user');
        res.redirect('/');
        
    } catch (error) {
        console.log(error.message);
    }
}
const loadDashboard = async(req,res) =>{
    try {
        if(req.session.user){
        const users = await User.find({_id: {$nin: [req.session.user._id]}});
        res.render('dashboard', { user: req.session.user, users:users });
        } else{
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Dashboard page loading failed' });
    }
}

const saveChat =async(req, res)=>{
    try {
      const chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message
        });
      const newChat= await chat.save();
        res.status(200).send({success:true, msg:'Chat inserted!', data: newChat});
        
    } catch (error) {
        res.status(400).send({success: false, msg:error.message});
    }
}

const deleteChat = async(req, res) =>{
    try {
       await  Chat.deleteOne({_id:req.body.id});
        res.status(200).send({success: true});
        
    } catch (error) {
        res.status(400).send({success: false, msg:error.message});
        
    }
}

const updateChat = async(req, res) =>{
    try {
       await Chat.findByIdAndUpdate({_id: req.body.id},{
            $set:{
                message: req.body.message
            }
        })
        res.status(200).send({success: true});
        
    } catch (error) {
        res.status(400).send({success: false, msg:error.message});
        
    }
}

const loadGroups = async(req,res)=>{
    try {
         const groups =  await Group.find({ creator_id: req.session.user._id });

        res.render('group', {groups: groups})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Groups loading failed' });
    }
}
const createGroup = async(req,res)=>{
    try {
       const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.name,
            image:'images/'+req.file.filename,
            limit: req.body.limit
        });
        await group.save();
        const groups =  await Group.find({ creator_id: req.session.user._id });

        res.render('group', {message: req.body.name+'Group Created Successfully!', groups:groups});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Groups loading failed' });
    }
}

const getMembers= async(req, res) =>{
    try {
      
        const users = await User.aggregate([
                {
                    $lookup:{
                        from:"members",
                        localField:"_id",
                        foreignField:"user_id",
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                         $and:[
                                            {$eq:[ "$group_id", ObjectID(req.body.group_id )]}
                                         ]
                                    }
                                }
                            }
                        ],
                        as:"member"
                    }
                },
                {
                  $match:{
                    "id":
                    { 
                         $nin:[ObjectID( req.session.user._id)]
                    }
                  }
                } 
        ]);

        res.status(200).send({success: true, data: users});
        
    } catch (error) {
        console.error("Error in getMembers:", error);
        res.status(400).send({success: false,  msg: "Internal Server Error"});
        
    }
}


const addMembers= async(req, res) =>{
    try {
        if(!req.body.members){
           res.status(200).send({success:false, msg:'Please select at least one of the Members!'});
        }
        else if( req.body.members.length > parseInt(req.body.limit)){
            res.status(200).send({success:false, msg:'You cannot select more than' +req.body.limit+ 'Members !'});
        }
        else{

          await Member.deleteMany({group_id: req.body.group_id });
           
            const data = [];
            const members = req.body.members;
            for( let i = 0; i < members.length; i++){

                data.push({

                    group_id: req.body.group_id,
                    user_id: members[i]
                });
            }

            await Member.insertMany(data);
           res.status(200).send({success: true, msg:'Members added Successfully!'});
        }
        
    } catch (error) {
        console.error("Error in getMembers:", error);
        res.status(400).send({success: false,  msg: "Internal Server Error"});
        
    }
}


module.exports = { registerLoad, register,
                    loadLogin, login, logout,
                       loadDashboard,
                         saveChat, deleteChat, 
                         updateChat,
                       loadGroups, createGroup,
                    getMembers, addMembers};