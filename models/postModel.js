const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Author = require("./authorModel");

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,

    default: Date.now,
  },
  text: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Author",
    required: true,
  },
  published: {
    type: String,
    enum: ["draft", "public"],
    required: true,
  },
  // Make the url field virtual
  url: {
    type: String,
    virtual: true,
    get() {
      return `/messages/${this._id}`;
    },
  },
});

module.exports = mongoose.model("Post", postSchema);

// module.exports = Message;
