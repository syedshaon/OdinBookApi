const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Post = require("../models/postModel");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  provider: {
    type: String,
  },
  providerId: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  profilePicture: {
    type: String,
  }, // URL or file path to the profile picture
  coverPicture: {
    type: String,
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  pendingFriends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  isActive: {
    type: Boolean,
    default: false,
  },
});

// Compile the schema into a model and export the model
module.exports = mongoose.model("User", userSchema);
