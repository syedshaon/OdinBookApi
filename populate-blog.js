require("dotenv").config();

const mongoose = require("mongoose");
const Post = require("./models/postModel");

const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
const Author = require("./models/authorModel");

// Create two sample blog posts
const post1 = new Post({
  title: "My first blog post!",
  text: "This is my first blog post. I'm so excited to be sharing my thoughts with the world!",
  author: "654f7dcea2d2010e66a831c6",
  published: "public",
});

const post2 = new Post({
  title: "My second blog post!",
  text: "This is my second blog post. I'm continuing to learn and grow, and I'm excited to share my progress with you all!",
  author: "654f7dcea2d2010e66a831c6",
  published: "public",
});

// Save the blog posts to the database
post1
  .save()
  .then(() => {
    console.log("Blog post 1 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });

post2
  .save()
  .then(() => {
    console.log("Blog post 2 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });
