require("dotenv").config();

const mongoose = require("mongoose");
const Visitor = require("./models/visitorModel");

const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Create two sample users
const user1 = new Visitor({
  firstName: "Robi",
  lastName: "Doe",
  username: "johndoe",
  password: "password123",
});

const user2 = new Visitor({
  firstName: "Soni",
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
