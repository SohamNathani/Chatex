var mongoose = require('mongoose');

var chatSchema = new mongoose.Schema({
    message : String,
    author: String
});


module.exports = mongoose.model("Chat", chatSchema);

