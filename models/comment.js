var mongoose = require("mongoose");
 
var commentSchema = new mongoose.Schema({
    text: String,
     createdAt: { 
      type: Date,
      defailt: Date.now
      
     },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
    },
});
 
module.exports = mongoose.model("Comment", commentSchema);