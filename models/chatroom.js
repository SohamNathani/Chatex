var mongoose = require('mongoose');

var chatroomSchema = new mongoose.Schema({
    name: String,
    chats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Chat'
    }
  ]
    
  });
  var Chatroom = mongoose.model("Chatroom", chatroomSchema);


  module.exports = Chatroom;