const Author = require("../models/authorModel");
const Posts = require("../models/postModel");
const BlackJWT = require("../models/blackjwt");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// // Verify a JWT token
const verifyToken = async (token) => {
  const isBlacklisted = await BlackJWT.findOne({ token });
  if (isBlacklisted) {
    // console.log("Blacklisted JWT: " + isBlacklisted.token);
    // res.status(401).send("Invalid JWT");
    const user = false;
    return user;
  } else {
    const secret = process.env.JWT_SECRET;

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, async (err, decodedToken) => {
        if (err) {
          // reject(err);
          const user = false;
          resolve(user);
        } else {
          const user = await Author.findOne({ _id: decodedToken.id });
          resolve(user);
        }
      });
    });
  }
};

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const authToken = req.headers.authorization;
  } else {
    const authToken = req.cookies.token;
  }

  if (authToken) {
    // Validate the auth token.
    const user = await verifyToken(authToken);
    if (user) {
      req.session.user = user;
      res.locals.user = user;
      return next();
    }
  }

  // The user is not authenticated.
  res.status(401).send("Unauthorized");
};

async function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, secret, options);
}

const authorController = {
  // If loggedin then show list of blog posts of this user
  async index(req, res) {
    const authors = await Author.find();
    res.json(authors);
  },

  // Create a new author
  async signup(req, res, next) {
    try {
      const { firstName, lastName, email, password, rpassword } = req.body;

      // Validate the user input
      if (!firstName || !lastName || !email || !password || !rpassword) {
        throw new Error("Missing required fields");
      }

      const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!email.match(regex)) {
        throw new Error("Email address is invalid!");
      }

      // Validate the password

      if (password === email) {
        throw new Error("Can't use the email address as password.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error("Password must contain at least one uppercase letter");
      }

      if (!/[a-z]/.test(password)) {
        throw new Error("Password must contain at least one lowercase letter");
      }

      if (!/[0-9]/.test(password)) {
        throw new Error("Password must contain at least one number");
      }

      // Ensure passwords match
      if (password !== rpassword) {
        throw new Error("Passwords do not match");
      }

      // Check if the user already exists
      const existingAuthor = await Author.findOne({ username: email });
      if (existingAuthor) {
        throw new Error("Email is already in use");
      }

      // Save the user to the database
      // await newAuthor.save();

      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        // if err, do something
        if (err) {
          console.log(err);
        } else {
          // otherwise, store hashedPassword in DB
          const newAuthor = new Author({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.email,
            password: hashedPassword,
          });
          const author = await newAuthor.save();
          const message = "An author account with " + author.username + " email address created successfully!";
          // res.json(author);
          // Send a success response
          res.status(201).json({ message: message });
          // res.render("report", { title: "Author created successfully!" });
        }
      });
    } catch (err) {
      next(err);
      // res.status(401).json({ err });
    }
  },

  // Authenticate author with jwt

  async signin(req, res) {
    // Get the user credentials from the request body
    const username = req.body.username;
    const password = req.body.password;

    // Find the user by their username
    const user = await Author.findOne({ username });

    // If the user is not found, return an error
    if (!user) {
      return res.status(404).json({ message: "Author not found" });
    }

    // Verify the password
    const match = await bcrypt.compare(password, user.password);

    // If the password is incorrect, return an error
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate a JWT token for the user
    const token = await generateToken(user);

    // Set the JWT token in a browser cookie
    res.cookie("token", token, {
      // expires: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
      expires: new Date(Date.now() + 60 * 60 * 1000), // Expires in 60 min
      httpOnly: true,
      secure: true,
    });

    // Send the token to the user
    return res.json({ token });
  },

  // Update an existing author
  async update(req, res, next) {
    const authToken = req.headers.authorization;

    if (authToken) {
      // Validate the auth token.
      const user = await verifyToken(authToken);
      if (user) {
        try {
          const { firstName, lastName, email, password, rpassword } = req.body;

          // Validate the user input
          if (!firstName || !lastName || !email || !password || !rpassword) {
            throw new Error("Missing required fields");
          }

          const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

          if (!email.match(regex)) {
            throw new Error("Email address is invalid!");
          }

          // Validate the password

          if (password === email) {
            throw new Error("Can't use the email address as password.");
          }

          if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
          }

          if (!/[A-Z]/.test(password)) {
            throw new Error("Password must contain at least one uppercase letter");
          }

          if (!/[a-z]/.test(password)) {
            throw new Error("Password must contain at least one lowercase letter");
          }

          if (!/[0-9]/.test(password)) {
            throw new Error("Password must contain at least one number");
          }

          // Ensure passwords match
          if (password !== rpassword) {
            throw new Error("Passwords do not match");
          }

          const currentUserID = user._id;
          const targetUsername = email;

          // Check if the user already exists
          const existingAuthor = await Author.findOne({
            _id: { $ne: currentUserID },
            username: targetUsername,
          });
          if (existingAuthor) {
            throw new Error("Email is already in use");
          }

          // Save the user to the database
          // await newAuthor.save();

          bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            // if err, do something
            if (err) {
              console.log(err);
            } else {
              // otherwise, store hashedPassword in DB
              // const updatedAuthor = new Author({
              //   firstName: req.body.firstName,
              //   lastName: req.body.lastName,
              //   username: req.body.email,
              //   password: hashedPassword,
              // });
              const updatedAuthor = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.email,
                password: hashedPassword,
              };
              const author = await Author.findByIdAndUpdate(user._id, updatedAuthor);
              // const message = "Author updated successfully";
              // Send a success response

              return res.status(201).json({ message: "Author updated successfully" });

              //  res.json({ message: message });
              //return res.json({  "Author updated successfully" });
              // res.render("report", { title: "Author created successfully!" });
            }
          });
        } catch (err) {
          next(err);
        }
      }
    } else {
      // The user is not authenticated.
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  // Delete an existing author
  async destroy(req, res) {
    const authToken = req.headers.authorization;
    if (authToken) {
      const user = await verifyToken(authToken);
      if (user) {
        const allPostsbyThisAuthor = await Posts.find({ author: user._id }, "title text").exec();

        if (allPostsbyThisAuthor.length > 0) {
          res.status(401).json({ message: "You first need to delete all your blog posts to delete your account." });
        } else {
          await Author.findByIdAndDelete(user._id);
          res.json({ message: "Author deleted successfully!" });
        }
      } else {
        // The user is not authenticated.
        res.status(401).json({ message: "No authorization" });
      }
    } else {
      // The user is not authenticated.
      res.status(401).json({ message: "Unauthorized" });
    }
  },
};

module.exports = authorController;
