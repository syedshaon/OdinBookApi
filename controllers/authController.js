var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../controllers/middleWare/passport");

const googleAuth = require("../controllers/middleWare/googleAuth");
const facebookAuth = require("../controllers/middleWare/facebookAuth");

const JWT_SECRET = process.env.JWT_SECRET;

const clientUrl = process.env.FRONT1;

const authController = {
  // Update an existing author
  signinGoogle: passport.authenticate("google", { scope: ["profile", "email"] }),
  googleSigninCallback: (req, res, next) => {
    passport.authenticate("google", { failureRedirect: "/auth/google_signin/error" })(req, res, async () => {
      try {
        // console.log(req.user);
        // Generate a JWT token after successful Google authentication
        const gUser = req.user;
        const user = await googleAuth.validateUser(gUser);
        if (user) {
          if (!user.isActive) {
            // Set isActive to true if not active
            user.isActive = true;
            await user.save();
          }
          // console.log("Before setting cookies");
          const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
          res.header("Set-Cookie", `auth_cookie=${token}; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `auth_error=false; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `no_user=false; Path=/; HttpOnly:false; Secure; SameSite=None;`);

          // res.cookie("auth_cookie", token, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("auth_error", false, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("no_user", false, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // console.log("After setting cookies");
          res.redirect(clientUrl);
        } else {
          // console.log("No User, Before setting cookies");
          // res.cookie("no_user", "true", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("auth_error", "", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          res.header("Set-Cookie", `auth_error=""; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `no_user=true; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          // console.log("No user, After setting cookies");
          res.redirect(clientUrl + "/login-auth-error");
        }
      } catch (error) {
        console.error("Error during Google authentication callback:", error);
        // res.cookie("auth_error", "true", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
        // res.cookie("no_user", "", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
        res.header("Set-Cookie", `auth_error=true; Path=/; HttpOnly:false; Secure; SameSite=None;`);
        res.header("Set-Cookie", `no_user=""; Path=/; HttpOnly:false; Secure; SameSite=None;`);

        res.redirect(clientUrl + "/login-auth-error");
      }
    });
  },
  googleSigninError: (req, res) => {
    res.cookie("auth-fail", true, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
    res.redirect(clientUrl);
  },

  signinFacebook: passport.authenticate("facebook", {
    scope: "email",
  }),
  facebookSigninCallback: (req, res, next) => {
    passport.authenticate("facebook", { failureRedirect: "/auth/facebook_signin/error" })(req, res, async () => {
      try {
        const fUser = req.user;
        const user = await facebookAuth.validateUser(fUser);
        if (user) {
          if (!user.isActive) {
            user.isActive = true;
            await user.save();
          }
          const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
          // res.cookie("auth_cookie", token, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("auth_error", false, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("no-user", false, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          res.header("Set-Cookie", `auth_cookie=${token}; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `auth_error=false; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `no_user=false; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.redirect(clientUrl);
        } else {
          // res.cookie("no_user", "true", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          // res.cookie("auth_error", "", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
          res.header("Set-Cookie", `auth_error=""; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.header("Set-Cookie", `no_user=true; Path=/; HttpOnly:false; Secure; SameSite=None;`);
          res.redirect(clientUrl + "/login-auth-error");
        }
      } catch (error) {
        console.error("Error during Facebook authentication callback:", error);
        // res.cookie("auth_error", "true", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
        // res.cookie("no_user", "", { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
        res.header("Set-Cookie", `auth_error=true; Path=/; HttpOnly:false; Secure; SameSite=None;`);
        res.header("Set-Cookie", `no_user=""; Path=/; HttpOnly:false; Secure; SameSite=None;`);
        res.redirect(clientUrl + "/login-auth-error");
      }
    });
  },
  facebookSigninError: (req, res) => {
    res.cookie("auth-fail", true, { sameSite: "None", secure: true, HttpOnly: false, path: "/" });
    res.redirect(clientUrl);
  },
};

module.exports = authController;
