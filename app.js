const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
 const mongoose = require('mongoose');
 const socketIo = require('socket.io');
 require('dotenv').config();

 const http = require('http').createServer(app); 
const user_route = require('./routes/userRoute.js');
const io = require('socket.io')(http);
const User = require('./models/userModel.js');
const Chat = require('./models/chatModel.js');

app.set('view engine', 'ejs');
app.set('views','./views');
app.use(bodyParser.json());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET, // Set your session secret from environment variables
  })
);
// Use the userRoute middleware
app.use('/', user_route);

const usp = io.of('/user-namespace');
usp.on('connection', async (socket) => {
      console.log('user connected');
     const userId  = socket.handshake.auth.token;
     await User.findByIdAndUpdate({_id: userId} , {$set:{ is_online: '1'}});

     //broadcasting
     socket.broadcast.emit('getOnlineUser', { user_id: userId});

      socket.on('disconnect',async () => {
      console.log('user disconnect');
      const userId  = socket.handshake.auth.token;
      await User.findByIdAndUpdate({_id: userId} , {$set:{ is_online: '0'}});
      socket.broadcast.emit('getOfflineUser', { user_id: userId});

      });
//Chatting implementation
     socket.on('newChat', (data)=>{
          socket.broadcast.emit('loadNewChat', data);
     })  

//load old chats
     socket.on('existsChat', async (data)=>{
        const chats =  await  Chat.find({ $or:[
            {sender_id: data.sender_id, receiver_id: data.receiver_id},
            {sender_id: data.receiver_id, receiver_id: data.sender_id}
          ]});

          socket.emit('loadChats', { chats: chats});
     });

// Delete Chats
   socket.on('chatDeleted', (id)=>{
           socket.broadcast.emit('chatMessageDeleted', id);
   });


// Update Chats
   socket.on('chatUpdated', (data)=>{
           socket.broadcast.emit('chatMessageUpdated', data);
   });

  });

const PORT = process.env.PORT||8000;                                                  
const url = process.env.MONGODB_URL;
 //DATABASE CONNECTION
mongoose.connect(url,
    {useNewUrlParser:true,
     useUnifiedTopology:true,})
    .then(()=>
    console.log("Database connected"))
    .catch(err =>
  console.log(`Error connecting to the database ${err}`));
    
http.listen(PORT,()=>{                                                               //PORT LISTENING
    console.log(`server is listening at port ${PORT}`);
});

