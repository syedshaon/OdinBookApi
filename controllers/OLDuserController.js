const User = require("../models/userModel");
const Posts = require("../models/postModel");
const BlackJWT = require("../models/blackjwt");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

const { sendConfirmationEmail, sendResetPWEmail } = require("./services/sendMail");

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
          const user = await User.findOne({ _id: decodedToken.id });
          resolve(user);
        }
      });
    });
  }
};

// // Verify a Refresh token
const verifyRefreshToken = async (token) => {
  const isBlacklisted = await BlackJWT.findOne({ token });
  if (isBlacklisted) {
    // console.log("Blacklisted JWT: " + isBlacklisted.token);
    // res.status(401).send("Invalid JWT");
    const user = false;
    return user;
  } else {
    const secret = process.env.JWT_REFRESH;

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, async (err, decodedToken) => {
        if (err) {
          // reject(err);
          const user = false;
          resolve(user);
        } else {
          const user = await User.findOne({ _id: decodedToken.id });
          resolve(user);
        }
      });
    });
  }
};

const isAuthenticated = async (req, res, next) => {
  let authToken;
  if (req.headers.authorization) {
    authToken = req.headers.authorization;
  }
  // Validate the auth token.
  const user = await verifyToken(authToken);
  if (user) {
    // req.session.user = user;
    req.user = user;
    // res.locals.user = user;
    return next();
  }

  // The user is not authenticated.
  res.status(401).json({ message: "Unauthorized" });
};

async function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: "15m",
  };

  return jwt.sign(payload, secret, options);
}

async function generateRefreshToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const secret = process.env.JWT_REFRESH;
  const options = {
    expiresIn: "10d",
  };

  return jwt.sign(payload, secret, options);
}

const userController = {
  // If loggedin then show list of blog posts of this user
  async index(req, res) {
    try {
      const user = req.user;
      if (user) {
        const allPostsbyThisUser = await Posts.find({ author: user._id }, "title timestamp  excerpt thumbnail author published");
        if (allPostsbyThisUser.length > 0) {
          const newUser = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          };
          return res.json({ posts: allPostsbyThisUser });
        } else {
          return res.json({ message: "You have no posts yet!" });
        }
      }

      res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },

  // Create a new author
  async signup(req, res, next) {
    try {
      const { username, password, repeatPassword, email, firstName, lastName } = req.body;

      // Check if required fields are provided
      if (!username || !password || !repeatPassword || !email || !firstName || !lastName) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!email.match(regex)) {
        return res.status(400).json({ error: "Email address is invalid!" });
      }

      // Check if passwords match
      if (password !== repeatPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
      }

      // Validate the password

      if (password === email) {
        return res.status(400).json({ error: "Can't use the email address as password." });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
      }

      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter." });
      }

      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter." });
      }

      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one number." });
      }

      // Check if the username or email is already in use
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ error: "Username or email is already in use." });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user with isActive set to false
      const newUser = new User({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        isActive: false,
      });

      // Save the user to the database
      await newUser.save();

      // Generate a token for email confirmation (expires in 2 hours)
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_CONFIRMATION, { expiresIn: "2h" });

      // Send a confirmation email with the token link
      sendConfirmationEmail(newUser.email, token);

      // Respond with a success message or user data
      res.status(201).json({ message: "Signup successful! Check your email for confirmation." });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      // Check if the email is provided
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      // Find the user by email
      const user = await User.findOne({ email });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Check if the user is already active
      if (user.isActive) {
        return res.status(400).json({ error: "User is already active." });
      }

      // Generate a new token for email confirmation (expires in 2 hours)
      const token = jwt.sign({ userId: user._id }, process.env.JWT_CONFIRMATION, { expiresIn: "2h" });

      // Send a new confirmation email with the new token link
      sendConfirmationEmail(user.email, token);

      // Respond with a success message
      res.status(200).json({ message: "Confirmation email resent. Check your email for confirmation." });
    } catch (error) {
      console.error("Error during resending confirmation email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      // console.log(token);

      // Verify the token
      const decodedToken = jwt.verify(token, process.env.JWT_CONFIRMATION);

      // Find the user by userId in the token
      const user = await User.findById(decodedToken.userId);

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Check if the user is already active
      if (user.isActive) {
        return res.status(400).json({ error: "User is already active." });
      }

      // Set isActive to true
      user.isActive = true;
      await user.save();

      res.status(200).json({ message: "You email is verified now. Please sign in with your user ID and Password." });

      // Optionally, you can redirect the user to a confirmation success page
      // res.redirect("http://your-frontend-app/confirmation-success"); // Adjust the frontend URL
    } catch (error) {
      // Handle token verification errors
      console.error("Error during email verification:", error);
      res.status(400).json({ error: "Invalid or expired token." });
    }
  },
  async getResetPass(req, res, next) {
    try {
      const { email } = req.body;

      // Check if the email is provided
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      // Find the user by email
      const user = await User.findOne({ email });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Generate a token for password reset (expires in 1 hour)
      const token = jwt.sign({ userId: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: "2h" });

      // Send a reset password email with the token link
      sendResetPWEmail(user.email, token);

      // Respond with a success message
      res.status(200).json({ message: "Reset password email sent. Check your email for instructions." });
    } catch (error) {
      console.error("Error during sending reset password email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  async resetPass(req, res, next) {
    try {
      const { token, newPassword, repeatPassword } = req.body;

      // Check if required fields are provided
      if (!token || !newPassword || !repeatPassword) {
        return res.status(400).json({ error: "All fields are required." });
      }

      // Check if passwords match
      if (newPassword !== repeatPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
      }

      // Verify the reset password token
      const decodedToken = jwt.verify(token, process.env.JWT_RESET_PASSWORD);

      // Find the user by userId in the token
      const user = await User.findById(decodedToken.userId);
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (newPassword === user.email) {
        return res.status(400).json({ error: "Can't use the email address as password." });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
      }

      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter." });
      }

      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter." });
      }

      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: "Password must contain at least one number." });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      // Respond with a success message
      res.status(200).json({ message: "Password reset successful." });
    } catch (error) {
      // Handle token verification errors
      console.error("Error during password reset:", error);
      res.status(400).json({ error: "Invalid or expired token." });
    }
  },
  async changePass(req, res, next) {},
  // Authenticate author with jwt

  async signin(req, res) {
    try {
      // Get the user credentials from the request body
      const email = req.body.email;
      const password = req.body.password;

      // Find the user by their username
      const user = await User.findOne({ email });

      // If the user is not found, return an error
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify the password
      const match = await bcrypt.compare(password, user.password);

      // If the password is incorrect, return an error
      if (!match) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Generate a JWT token for the user
      const token = await generateToken(user);
      const tokenExpires = new Date(Date.now() + 60 * 15 * 1000);
      const refreshtoken = await generateRefreshToken(user);

      // Set the JWT Refresh token in  browser cookie
      // res.cookie("refreshtoken", refreshtoken, {
      //   // expires: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
      //   expires: new Date(Date.now() + 60 * 60 * 24 * 10 * 1000), // Expires in 10 days
      //   httpsOnly: true,
      //   sameSite: "None",
      //   secure: true,
      // });

      // The above code is unable to set cookie on live site. I've tested different samesite attribute but result it same.

      // res.header("Set-Cookie", "refreshtoken=" + refreshtoken + ";Path=/;HttpOnly;Secure;SameSite=None;Expires=864000");
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 864000 * 1000); // Add milliseconds
      const expires = expirationDate.toUTCString();

      res.header("Set-Cookie", `refreshtoken=${refreshtoken}; Path=/; HttpOnly; Secure; SameSite=None; Expires=${expires}`);

      // Send the token to the user
      return res.json({ token, expire: tokenExpires, firstName: user.firstName });
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async refresh(req, res) {
    // Verify refresh token

    try {
      if (!req.cookies.refreshtoken) {
        return res.status(500).json({ message: "No Refresh Token Provided.", error: true });
      }

      const RefreshToken = req.cookies.refreshtoken;

      // Validate the auth token.
      const user = await verifyRefreshToken(RefreshToken);

      // If the user is not found, return an error
      if (!user) {
        return res.status(404).json({ message: "User not found", error: true });
      }

      // Generate a JWT token for the user
      const token = await generateToken(user);
      const tokenExpires = new Date(Date.now() + 60 * 15 * 1000);
      // Send the token to the user
      return res.json({ token, expire: tokenExpires, firstName: user.firstName });
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async validateLoginStatus(req, res) {
    try {
      if (req.headers.authorization) {
        let authToken = req.headers.authorization;

        // Validate the auth token.
        const user = await verifyToken(authToken);
        if (user) {
          // req.session.user = user;

          return res.json({ firstName: user.firstName });
        }
      }
      return res.json({});
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async signout(req, res, next) {
    try {
      // Invalidate the user's JWT token.
      // const token = req.headers.authorization.split(" ")[1];
      if (req.headers.authorization) {
        const token = req.headers.authorization;

        const newblacklistedJWT = new BlackJWT({
          token: token,
        });
        const result = await newblacklistedJWT.save();

        // res.clearCookie("token");
        res.clearCookie("refreshtoken");
        return res.status(201).json({ logout: true, message: "Signed Out successfully!" });
      } else {
        return res.status(401).json({ logout: false, message: "You need to be logged in to logout." });
      }
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async author_update_get(req, res, next) {
    try {
      const user = req.user;
      return res.status(201).json({ firstName: user.firstName, lastName: user.lastName, email: user.username });
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },

  // Update an existing author
  async author_update(req, res, next) {
    // Validate the auth token.
    const user = req.user;
    if (user) {
      try {
        const { firstName, lastName, email, password, rpassword } = req.body;

        // Validate the user input
        if (!firstName || !lastName || !email || !password || !rpassword) {
          // throw new Error("Missing required fields");
          return res.status(422).send({ message: "Missing required fields" });
        }

        const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!email.match(regex)) {
          // throw new Error("Email address is invalid!");
          return res.status(422).send({ message: "Email address is invalid!" });
        }

        // Validate the password

        if (password === email) {
          // throw new Error("Can't use the email address as password.");
          return res.status(422).send({ message: "Can't use the email address as password." });
        }

        if (password.length < 8) {
          // throw new Error("Password must be at least 8 characters long");
          return res.status(422).send({ message: "Password must be at least 8 characters long" });
        }

        if (!/[A-Z]/.test(password)) {
          // throw new Error("Password must contain at least one uppercase letter");
          return res.status(422).send({ message: "Password must contain at least one uppercase letter" });
        }

        if (!/[a-z]/.test(password)) {
          // throw new Error("Password must contain at least one lowercase letter");
          return res.status(422).send({ message: "Password must contain at least one lowercase letter" });
        }

        if (!/[0-9]/.test(password)) {
          // throw new Error("Password must contain at least one number");
          return res.status(422).send({ message: "Password must contain at least one number" });
        }

        // Ensure passwords match
        if (password !== rpassword) {
          // throw new Error("Passwords do not match");
          return res.status(422).send({ message: "Passwords do not match" });
        }

        const currentUserID = user._id;
        const targetUsername = email;

        // Check if the user already exists
        const existingUser = await User.findOne({
          _id: { $ne: currentUserID },
          username: targetUsername,
        });
        if (existingUser) {
          // throw new Error("Email is already in use");
          return res.status(422).send({ message: "Email is already in use" });
        }

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          // if err, do something
          if (err) {
            console.log(err);
          } else {
            const updatedUser = {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              username: req.body.email,
              password: hashedPassword,
            };
            const author = await User.findByIdAndUpdate(user._id, updatedUser);

            const token = req.headers.authorization;

            // When user updates. blacklist his previous jwt.
            const newblacklistedJWT = new BlackJWT({
              token: token,
            });
            const result = await newblacklistedJWT.save();

            res.clearCookie("refreshtoken");

            return res.status(201).json({ message: "User updated successfully" });
          }
        });
      } catch (err) {
        let errorMessage = "Internal server error";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        res.status(401).json({ message: errorMessage });
      }
    }
  },

  // Delete an existing author
  async author_delete(req, res) {
    try {
      const user = req.user;
      if (user) {
        const allPostsbyThisUser = await Posts.find({ author: user._id }, "title text").exec();

        if (allPostsbyThisUser.length > 0) {
          res.status(401).json({ delete: false, message: "You first need to delete all your blog posts to delete your account." });
        } else {
          await User.findByIdAndDelete(user._id);
          res.clearCookie("refreshtoken");
          return res.json({ delete: true, message: "User deleted successfully!" });
        }
      }
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async post_create(req, res, next) {
    const user = req.user;
    if (user) {
      try {
        const { title, text, published, excerpt } = req.body;

        // Validate the user input
        if (!title || !text || !published || !excerpt) {
          throw new Error("Missing required fields");
        }

        // otherwise, store hashedPassword in DB
        const newPost = new Posts({
          title: title,
          text: text,
          author: user._id,
          published: published,
          excerpt: excerpt,
          thumbnail: req.file.path,
        });
        const post = await newPost.save();

        // Send a success response
        return res.status(201).json({ message: "Post Created Successfully!" });
      } catch (err) {
        let errorMessage = "Internal server error";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        res.status(401).json({ message: errorMessage });
      }
    }
  },
  async post_show(req, res, next) {
    try {
      const user = req.user;
      const id = req.params.id;

      const post = await Posts.findById(id);
      if (post) {
        if (JSON.stringify(post.author) === JSON.stringify(user._id)) {
          // return res.json({ post: post.author, author: user._id });
          return res.json({ title: post.title, timestamp: post.timestamp, text: post.text, published: post.published, excerpt: post.excerpt, thumbnail: post.thumbnail });
        }
      }
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async post_edit(req, res, next) {
    const user = req.user;
    const id = req.params.id;

    try {
      if (user) {
        const post = await Posts.findById(id);
        // const val = JSON.stringify(post.author) === JSON.stringify(user._id);
        // return res.json({ val });
        if (post) {
          if (JSON.stringify(post.author) === JSON.stringify(user._id)) {
            // return res.json({ post: post.author, author: user._id });
            try {
              const { title, text, published, excerpt } = req.body;

              // Validate the user input
              if (!title || !text || !published || !excerpt) {
                throw new Error("Missing required fields");
              }

              // console.log("ok");
              // otherwise, store hashedPassword in DB
              const updatedPost = req.file
                ? {
                    title: title,
                    text: text,
                    author: user._id,
                    excerpt: excerpt,
                    published: published,
                    thumbnail: req.file.path,
                  }
                : {
                    title: title,
                    text: text,
                    author: user._id,
                    excerpt: excerpt,
                    published: published,
                  };
              await Posts.findByIdAndUpdate(id, updatedPost);

              const uPost = await Posts.findById(id);

              // Send a success response
              return res.status(201).json({ post: uPost });
            } catch (err) {
              next(err);
            }
          }
        }
      }
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
  async post_delete(req, res, next) {
    const user = req.user;
    const id = req.params.id;
    try {
      const post = await Posts.findById(id);
      if (post) {
        if (JSON.stringify(post.author) === JSON.stringify(user._id)) {
          // return res.json({ post: post.author, author: user._id });
          try {
            await Posts.findByIdAndDelete(id);

            // Send a success response
            return res.json({ message: "Post deleted successfully!" });
          } catch (err) {
            let errorMessage = "Internal server error";

            if (err instanceof Error) {
              errorMessage = err.message;
            }

            res.status(401).json({ message: errorMessage });
          }
        }
      } else {
        res.status(401).json({ message: "Post not found!" });
      }
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },
};

module.exports = { userController, isAuthenticated };
