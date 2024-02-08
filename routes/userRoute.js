const { v4: uuidv4 } = require("uuid");
var express = require("express");
var router = express.Router();
const userController = require("../controllers/userController");

const followerController = require("../controllers/followerController");
const signin = require("../controllers/services/signin");

const passport = require("passport");
const requireJwtAuth = passport.authenticate("jwt", { session: false });

const isTokenBlacklisted = require("../controllers/services/blackListCheck");

// RELATED TO IMAGE UPLOAD WITH MULTER START
const path = require("path");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, __dirname);
    // cb(null, path.join(__dirname, '/uploads/'));
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // cb(null, new Date().toISOString() + file.originalname);
    cb(null, uuidv4() + "~" + file.originalname);
  },
});

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     return cb(null, "./uploads");
//   },
//   filename: function (req, file, cb) {
//     return cb(null, `${Date.now()}_${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/webp") {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 512,
  },
  fileFilter: fileFilter,
});

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).send({ message: "File size exceeds the limit (512KB)" });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      // The file type is not supported.
      return res.status(400).send({ message: "The file type is not supported." });
    }
    // Handle other Multer errors here, if needed
  } else {
    // An unknown error occurred
    console.error(err);
    return res.status(500).send({ message: "An error occurred while uploading the file" });
  }
};
// RELATED TO IMAGE UPLOAD WITH MULTER END

// router.get("/test", isTokenBlacklisted, requireJwtAuth, userController.test);
// ################### Sign Up #############################
//  DONE

// router.get("/test", userController.test);
router.post("/signup", userController.signup);
router.post("/getVerificationEmail", userController.getVerificationEmail);
router.get("/verifyEmail", userController.verifyEmail);
router.post("/getResetPass", userController.getResetPass);
router.post("/resetPass", userController.resetPass);

router.post("/changePass", isTokenBlacklisted, requireJwtAuth, userController.changePass);

// ################### Sign In #############################

router.post("/signin", signin);

// ################### Refresh Token #############################

router.get("/refresh", userController.refresh);
router.get("/loadme", userController.loadme);

// ################### Validate login status #############################

router.post("/validateLoginStatus", isTokenBlacklisted, requireJwtAuth, userController.validateLoginStatus);

// ###################  Sign Out  ###############################

router.post("/signout", userController.signout);

// ################### update an existing author #############################
// Route to update an existing author

router.get("/update", isTokenBlacklisted, requireJwtAuth, userController.user_update_get);
router.put("/update", isTokenBlacklisted, requireJwtAuth, userController.userUpdate);
router.put("/updateProfilePic", upload.single("file"), errorHandler, isTokenBlacklisted, requireJwtAuth, userController.updateProfilePic);
router.put("/updateCoverPic", upload.single("file"), errorHandler, isTokenBlacklisted, requireJwtAuth, userController.updateCoverPic);

router.get("/profile-details/:uid", isTokenBlacklisted, requireJwtAuth, userController.profileDetails);

// Route to delete an existing author
// Not DONE
// router.delete("/delete", isTokenBlacklisted, requireJwtAuth, userController.user_delete);

// ################### Blog Posts #############################
// Will show all published and draft posts if logged in

// router.get("/posts", isTokenBlacklisted, requireJwtAuth, userController.index);

// ################### Single Post #############################
// Create single post

// router.post("/posts", upload.single("file"), errorHandler, isTokenBlacklisted, requireJwtAuth, userController.post_create);

// Show single post

// router.get("/posts/:id", isTokenBlacklisted, requireJwtAuth, userController.post_show);
// Update single post

// router.put("/posts/:id", upload.single("file"), errorHandler, isTokenBlacklisted, requireJwtAuth, userController.post_edit);
// Delete single post

// router.delete("/posts/:id", isTokenBlacklisted, requireJwtAuth, userController.post_delete);

router.post("/follow/:followingId", isTokenBlacklisted, requireJwtAuth, followerController.follow);

router.post("/unfollow/:unfollowingId", isTokenBlacklisted, requireJwtAuth, followerController.unfollow);

router.post("/sendFriendRequest/:friendId", isTokenBlacklisted, requireJwtAuth, followerController.sendFriendRequest);

router.post("/cancelFriendRequest/:friendId", isTokenBlacklisted, requireJwtAuth, followerController.cancelFriendRequest);
router.post("/acceptFriendRequest/:friendId", isTokenBlacklisted, requireJwtAuth, followerController.acceptFriendRequest);
router.post("/rejectFriendRequest/:friendId", isTokenBlacklisted, requireJwtAuth, followerController.rejectFriendRequest);
router.post("/deleteFriend/:friendId", isTokenBlacklisted, requireJwtAuth, followerController.deleteFriend);

router.get("/peopleDetails", isTokenBlacklisted, requireJwtAuth, followerController.getAllUsers);

module.exports = router;
