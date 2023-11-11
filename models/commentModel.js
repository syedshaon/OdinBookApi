const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Visitor = require("./visitorModel");
const Post = require("./postModel");

const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  visitor: {
    type: Schema.Types.ObjectId,
    ref: "Visitor",
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
});

module.exports = mongoose.model("Comment", commentSchema);

// module.exports = Message;
