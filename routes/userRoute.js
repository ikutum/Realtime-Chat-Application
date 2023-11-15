const express = require('express');
const user_route = express.Router();
const bodyParser = require('body-parser');

const session = require('express-session');
const { SESSION_SECRET } = process.env;
const cookieParser = require ('cookie-parser');
user_route.use(cookieParser());

const app = express();

app.use(session({
   resave: false, // Set to false to resolve the deprecation warning
   saveUninitialized: true, // Set to true to resolve the deprecation warning
   secret:  'SESSION_SECRET'
    // Replace 'your-secret-key-here' with a secure secret
   // Other session options...
 }));

//user_route.use(session({ session: SESSION_SECRET}));
user_route.use(bodyParser.json());
 user_route.use(bodyParser.urlencoded( {extended:true} ));
 
//router.set('view engine','ejs');
 //router.set('views','./views');

 user_route.use(express.static('public'));

 const path = require('path');
 const multer = require('multer');
 //const upload = multer({ dest: '../public/images' });
 const storage = multer.diskStorage({
    destination:function(req, file, cb){
cb(null, path.join(__dirname, '../public/images'));
    },
    filename:function(req, file, cb){
        const name = Date.now()+'-'+file.originalname;
   cb(null, name);
    }
 });
 const upload = multer({
    storage: storage
 });

 const userController = require('../controllers/userController');

 const auth = require ('../middlewares/auth');

 user_route.get('/register', auth.isLogout, userController.registerLoad );
 user_route.post('/register', upload.single('image'), userController.register);

user_route.get('/', auth.isLogout, userController.loadLogin);
user_route.post('/', userController.login);
user_route.get('/logout', auth.isLogin, userController.logout);

user_route.get('/dashboard', auth.isLogin, userController.loadDashboard);

user_route.post('/save-chat', userController.saveChat);
user_route.post('/delete-chat', userController.deleteChat);
user_route.post('/update-chat', userController.updateChat);

user_route.get('/groups', auth.isLogin, userController.loadGroups );
user_route.post('/groups',upload.single('image'),  userController.createGroup );

user_route.post('/get-members', auth.isLogin, userController.getMembers);
user_route.post('/add-members', auth.isLogin, userController.addMembers);

user_route.get('*', (req,res)=>{
   res.redirect('/');
});

module.exports = user_route;