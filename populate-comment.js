require("dotenv").config();

const mongoose = require("mongoose");
const Post = require("./models/postModel");
const Visitor = require("./models/visitorModel");
const Comment = require("./models/commentModel");

const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Create four sample comments
const comment1 = new Comment({
  text: "This is a great post!",
  visitor: "654f800af6e0bfd008d37f5f",
  post: "654f7f8d145072df5c2aedcb",
});

const comment2 = new Comment({
  text: "I really enjoyed reading this post. It was very informative.",
  visitor: "654f800af6e0bfd008d37f5f",
  post: "654f7f8d145072df5c2aedca",
});

const comment3 = new Comment({
  text: "I have a question about this post. Can you help me understand something?",
  visitor: "654f800af6e0bfd008d37f5e",
  post: "654f7f8d145072df5c2aedcb",
});

const comment4 = new Comment({
  text: "Thank you for writing this post. It was very helpful!",
  visitor: "654f800af6e0bfd008d37f5e",
  post: "654f7f8d145072df5c2aedca",
});

// Save the comments to the database
comment1
  .save()
  .then(() => {
    console.log("Comment 1 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });

comment2
  .save()
  .then(() => {
    console.log("Comment 2 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });

comment3
  .save()
  .then(() => {
    console.log("Comment 3 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });

comment4
  .save()
  .then(() => {
    console.log("Comment 4 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });
