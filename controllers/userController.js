const User = require("../models/userModel");
const Posts = require("../models/postModel");
const BlackJWT = require("../models/blackjwt");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

const { sendConfirmationEmail, sendResetPWEmail } = require("./services/sendMail");
const { verifyToken, verifyRefreshToken } = require("./services/verifyToken");
const { generateToken, generateRefreshToken } = require("./services/generateToken");

const userController = {
  // Create a new author
  async signup(req, res, next) {
    console.log(req.body);
    try {
      const { username, password, repeatPassword, email, firstName, lastName } = req.body;

      // Check if required fields are provided
      if (!username || !password || !repeatPassword || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!email.match(regex)) {
        return res.status(400).json({ message: "Email address is invalid!" });
      }

      // Check if passwords match
      if (password !== repeatPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      // Validate the password

      if (password === email) {
        return res.status(400).json({ message: "Can't use the email address as password." });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
      }

      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
      }

      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
      }

      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one number." });
      }

      // Check if the username or email is already in use
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: "Username or email is already in use." });
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
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async getVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      // Check if the email is provided
      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      // Find the user by email
      const user = await User.findOne({ email });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Check if the user is already active
      if (user.isActive) {
        return res.status(200).json({ message: "User is already active. Please sign in with your user ID and Password." });
      }

      // Generate a new token for email confirmation (expires in 2 hours)
      const token = jwt.sign({ userId: user._id }, process.env.JWT_CONFIRMATION, { expiresIn: "2h" });

      // Send a new confirmation email with the new token link
      sendConfirmationEmail(user.email, token);

      // Respond with a success message
      res.status(200).json({ message: "Confirmation email resent. Check your email for confirmation." });
    } catch (error) {
      console.error("Error during resending confirmation email:", error);
      res.status(500).json({ message: "Internal server error" });
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
        return res.status(404).json({ message: "User not found." });
      }

      // Check if the user is already active
      if (user.isActive) {
        return res.status(200).json({ message: "User is already active. Please sign in with your user ID and Password." });
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
      res.status(400).json({ message: "Invalid or expired token." });
    }
  },
  async getResetPass(req, res, next) {
    try {
      const { email } = req.body;

      // Check if the email is provided
      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      // Find the user by email
      const user = await User.findOne({ email });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Generate a token for password reset (expires in 1 hour)
      const token = jwt.sign({ userId: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: "2h" });

      // Send a reset password email with the token link
      sendResetPWEmail(user.email, token);

      // Respond with a success message
      res.status(200).json({ message: "Reset password email sent. Check your email for instructions." });
    } catch (error) {
      console.error("Error during sending reset password email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  async resetPass(req, res, next) {
    try {
      const { token, newPassword, repeatPassword } = req.body;

      // Check if required fields are provided
      if (!token || !newPassword || !repeatPassword) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Check if passwords match
      if (newPassword !== repeatPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      // Verify the reset password token
      const decodedToken = jwt.verify(token, process.env.JWT_RESET_PASSWORD);

      // Find the user by userId in the token
      const user = await User.findById(decodedToken.userId);
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (newPassword === user.email) {
        return res.status(400).json({ message: "Can't use the email address as password." });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
      }

      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
      }

      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
      }

      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one number." });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      // Respond with a success message
      res.status(200).json({ message: "Password Reset successful." });
    } catch (error) {
      // Handle token verification errors
      console.error("Error during password reset:", error);
      res.status(400).json({ message: "Invalid or expired token." });
    }
  },
  async changePass(req, res, next) {
    const user = req.user;
    if (user) {
      try {
        const { currentPassword, newPassword, repeatPassword } = req.body;

        // Check if required fields are provided
        if (!currentPassword || !newPassword || !repeatPassword) {
          return res.status(400).json({ message: "All fields are required." });
        }

        // Check if passwords match
        if (newPassword !== repeatPassword) {
          return res.status(400).json({ message: "Passwords do not match." });
        }

        // Check if the current password is correct
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect." });
        }

        if (newPassword === user.email) {
          return res.status(400).json({ message: "Can't use the email address as newPassword." });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        if (!/[A-Z]/.test(newPassword)) {
          return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
        }

        if (!/[a-z]/.test(newPassword)) {
          return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
        }

        if (!/[0-9]/.test(newPassword)) {
          return res.status(400).json({ message: "Password must contain at least one number." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Following will invalidate previous jwt and refresh token and from front-end will need to ask for loggin in agian.

        const token = req.headers.authorization;

        // When user updates. blacklist his previous jwt.
        const newblacklistedJWT = new BlackJWT({
          token: token,
        });
        const result = await newblacklistedJWT.save();

        res.clearCookie("refreshtoken");

        // Respond with a success message
        res.status(200).json({ message: "Password changed successfully." });
      } catch (error) {
        // Handle token verification errors
        console.error("Error during password change:", error);

        res.status(401).json({ message: "Internal server error" });
      }
    }
  },
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
      return res.status(200).json({ token, expire: tokenExpires, firstName: user.firstName });
    } catch (error) {
      // Handle token verification errors
      console.error("Error during signing In:", error);
      res.status(400).json({ message: "Internal server error." });
    }
  },
  async refresh(req, res) {
    // Verify refresh token

    try {
      if (!req.cookies.refreshtoken) {
        return res.status(500).json({ message: "No Refresh Token Provided.", message: true });
      }

      const RefreshToken = req.cookies.refreshtoken;

      // Validate the auth token.
      const user = await verifyRefreshToken(RefreshToken);

      // If the user is not found, return an error
      if (!user) {
        return res.status(404).json({ message: "User not found", message: true });
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
      return res.status(201).json({ firstName: user.firstName, lastName: user.lastName, email: user.email, bio: user.bio, profilePicture: user.profilePicture, coverPicture: user.coverPicture });
    } catch (err) {
      let errorMessage = "Internal server error";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      res.status(401).json({ message: errorMessage });
    }
  },

  // Update an existing author
  async userUpdate(req, res, next) {
    console.log(req.file);
    // Validate the auth token.
    const user = req.user;
    if (user) {
      try {
        // return res.status(201).json({ firstName: user.firstName, lastName: user.lastName, email: user.email, bio: user.bio, profilePicture: user.profilePicture, coverPicture: user.coverPicture });

        const { firstName, lastName, email, bio } = req.body;

        if (email) {
          const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
          if (!email.match(regex)) {
            // throw new Error("Email address is invalid!");
            return res.status(422).send({ message: "Email address is invalid!" });
          }
          const currentUserID = user._id;

          // Check if the email is used by another user
          const existingUser = await User.findOne({
            _id: { $ne: currentUserID },
            email: email,
          });
          if (existingUser) {
            // throw new Error("Email is already in use");
            return res.status(422).send({ message: "Email is already in use" });
          }

          // Update the user's password
          user.email = email;
        }

        if (firstName) {
          user.firstName = firstName;
        }
        if (lastName) {
          user.lastName = lastName;
        }
        if (bio) {
          user.bio = bio;
        }
        // if (req.file.path) {
        //   user.profilePicture = req.file.path;
        // }
        // if (req.file.path) {
        //   user.coverPicture = req.file.path;
        // }
        await user.save();

        return res.status(201).json({ message: "User updated successfully" });
      } catch (err) {
        let errorMessage = "Internal server error";

        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.log(err);

        res.status(401).json({ message: errorMessage });
      }
    }
  },
  async updateProfilePic(req, res, next) {
    const user = req.user;
    if (user) {
      try {
        if (req.file.path) {
          user.profilePicture = req.file.path;
        }

        await user.save();

        return res.status(201).json({ message: "User updated successfully" });
      } catch (err) {
        let errorMessage = "Internal server error";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        res.status(401).json({ message: errorMessage });
      }
    }
  },
  async updateCoverPic(req, res, next) {
    const user = req.user;
    if (user) {
      try {
        if (req.file.path) {
          user.coverPicture = req.file.path;
        }

        await user.save();

        return res.status(201).json({ message: "User updated successfully" });
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
};

module.exports = userController;