require("dotenv").config();

const mongoose = require("mongoose");
const Author = require("./models/authorModel");

const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Create two sample users
const user1 = new Author({
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  password: "password123",
});

const user2 = new Author({
  firstName: "Jane",
  lastName: "Doe",
  username: "janedoe",
  password: "password456",
});

// Save the users to the database
user1
  .save()
  .then(() => {
    console.log("User 1 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });

user2
  .save()
  .then(() => {
    console.log("User 2 saved successfully!");
  })
  .catch((err) => {
    console.error(err);
  });
