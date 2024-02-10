var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../controllers/services/passport");

const googleAuth = require("../controllers/services/googleAuth");
const facebookAuth = require("../controllers/services/facebookAuth");

const JWT_SECRET = process.env.JWT_SECRET;

const clientUrl = process.env.NODE_ENV === "production" ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV;

// Redirect the user to Google for authentication when they hit the login route.
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: "email",
  })
);

// The callback after Google has authenticated the user.
router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/auth/facebook/error" }), async (req, res) => {
  try {
    // Generate a JWT token after successful Google authentication
    const fUser = req.user;
    // console.log("found user:", req.user);
    const user = await facebookAuth.validateUser(fUser);
    if (user) {
      if (!user.isActive) {
        // Set isActive to true if not active
        user.isActive = true;
        await user.save();
      }
      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
      res.cookie("auth_cookie", token);
      res.cookie("auth_error", false);
      res.cookie("no-user", false);
      res.redirect(clientUrl);
    } else {
      res.cookie("no_user", "true");
      res.cookie("auth_error", "");
      res.redirect(clientUrl + "/login-auth-error");
    }
  } catch (error) {
    console.error("Error during Facebook authentication callback:", error);
    res.cookie("auth_error", "true");
    res.cookie("no_user", "");
    res.redirect(clientUrl + "/login-auth-error");
  }
});

router.get("/facebook/error", (req, res) => {
  res.cookie("auth-fail", true);
  res.redirect(clientUrl);
});

// The callback after Google has authenticated the user.
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/auth/google/error" }), async (req, res) => {
  try {
    // Generate a JWT token after successful Google authentication
    const gUser = req.user;
    const user = await googleAuth.validateUser(gUser);
    if (user) {
      if (!user.isActive) {
        // Set isActive to true if not active
        user.isActive = true;
        await user.save();
      }
      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
      res.cookie("auth_cookie", token);
      res.cookie("auth_error", false);
      res.cookie("no-user", false);
      res.redirect(clientUrl);
    } else {
      res.cookie("no_user", "true");
      res.cookie("auth_error", "");
      res.redirect(clientUrl + "/login-auth-error");
    }
  } catch (error) {
    console.error("Error during Google authentication callback:", error);
    res.cookie("auth_error", "true");
    res.cookie("no_user", "");
    res.redirect(clientUrl + "/login-auth-error");
  }
});

router.get("/google/error", (req, res) => {
  res.cookie("auth-fail", true);
  res.redirect(clientUrl);
});

// router.get("/google/success", async (req, res) => {
//   const { failure, success } = await googleAuth.registerWithGoogle(req.user);
//   if (failure) console.log("Google user already exist in DB..");
//   else console.log("Registering new Google user..");
//   // res.render("success", { user: userProfile });
//   res.status(201).json({ user: userProfile });
// });

router.get("/google/error", (req, res) => {
  res.cookie("auth-fail", true);
  res.redirect(clientUrl);
});

module.exports = router;
