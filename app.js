var express = require('express'); //express framework
var mongoose = require('mongoose');// framework for mongodb
var app = express(); // calling express in app variable
var passport = require('passport'); // passport js for validation
var LocalStrategy  = require('passport-local');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require("socket.io").listen(server);
mongoose.connect("mongodb://localhost/chat_app");
var Chatroom = require("./models/chatroom.js");
var Chats = require("./models/chats.js");
var User = require("./models/user.js");


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs"); //Setting default extension to be ejs


//CONFIGURING PASSPORT
app.use(require("express-session")({
  secret: "Laal bindi mai tu inni soni lagdi",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser =req.user;
  next();
})

/*
---------------
ROUTING
---------------
*/

//HOME PAGE ROUTE
app.get('/', function(req, res){
    res.render('home');
});
// CHAT ROOM ROUTE
app.get('/chatroom', function(req,res){
  Chatroom.find({}, function(err, allChatroom){
    if(err){
      console.log(err);
    }else{
      res.render('chat_room',{allChatroom: allChatroom, currentUser: req.user});
    }
  })

});
//CREATING NEW ROUTE
app.get('/chatroom/new', function(req, res){
  res.render('new_chatroom');
});

//POST REQUEST TO ROUTE
app.post('/chatroom', function(req,res){
    Chatroom.create(
      { name: req.body.Name}, function(err, newly){
        if(err){
          console.log(err);
        }else{
          res.redirect('/chatroom');
        }
      })
});

//SHOW REQUEST TO CHATROOM
app.get('/chatroom/:id',isLoggedIn, function(req, res){
    Chatroom.findById(req.params.id).populate("chats").exec(function(err, foundChatroom){
      if(err){
        console.log(err);
      }else{

        res.render('show_chatroom', {foundChatroom: foundChatroom})
      }
    });
})

//-----------------
//AUTH ROUTING
//-----------------

//Sign Up[] Form
app.get("/register", function(req, res){
  res.render("register");
});
app.post("/register", function(req, res){
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user){
    if(err){
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function(){
      res.redirect("/")
    })
  })
});

//Login form
app.get("/login", function(req, res){
  res.render("login")
})
app.post("/login", passport.authenticate("local",
    {
      successRedirect: "/",
      failureRedirect: "/login"
    }), function(req, res){

    });

 //Logout
 app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/")
 })

//Socket for real time communication
io.on('connection', function(socket){
  var chatroomid;
  var socket_current_user;
  socket.on('chatroom id', function(chatroom_id){
    chatroomid = chatroom_id;
    //console.log(chatroomid);
    io.emit('chatroom check', chatroomid)
    });
  socket.on('current user', function(CurrentUser){
    socket_current_user = CurrentUser;
    console.log(socket_current_user);
  })

  socket.on('chat message', function(msg){
         Chatroom.findById(chatroomid, function(err, chatroom){

           Chats.create({message: msg}, function(err, chat){

            //console.log(socket_current_user);
            chat.author = socket_current_user;

            chat.save();
            //console.log(chat.author);
            //chat.author.id = socket_current_user._id;
            //chat.author.username = socket_current_user.username;
            chatroom.chats.push(chat);
            chatroom.save();
            //console.log(chat);
            //Chats.findById(chat._id).populate("author").exec(function(err, chat_found){
              //console.log(chat_found.author.username);
            io.emit('new message',chat);
            //})
          })
        });
     });
  });

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login")
}

//SETTING NODE JS TO RUN ON PORT
server.listen(8080, function(){
  console.log("Server running on 8080")
});
