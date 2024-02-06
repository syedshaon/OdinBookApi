const { v4: uuidv4 } = require("uuid");
var express = require("express");
var router = express.Router();
const userController = require("../controllers/userController");
const isAuthenticated = require("../controllers/services/isAuthenticated");
const followerController = require("../controllers/followerController");

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

// router.get("/test", isAuthenticated, userController.test);
// ################### Sign Up #############################
//  DONE
router.get("/test", userController.test);
router.post("/signup", userController.signup);
router.post("/getVerificationEmail", userController.getVerificationEmail);
router.get("/verifyEmail", userController.verifyEmail);
router.post("/getResetPass", userController.getResetPass);
router.post("/resetPass", userController.resetPass);

router.post("/changePass", isAuthenticated, userController.changePass);

// ################### Sign In #############################

router.post("/signin", userController.signin);

// ################### Refresh Token #############################

router.get("/refresh", userController.refresh);

// ################### Validate login status #############################

router.post("/validateLoginStatus", userController.validateLoginStatus);

// ###################  Sign Out  ###############################

router.post("/signout", userController.signout);

// ################### update an existing author #############################
// Route to update an existing author

router.get("/update", isAuthenticated, userController.user_update_get);
router.put("/update", isAuthenticated, userController.userUpdate);
router.put("/updateProfilePic", upload.single("file"), errorHandler, isAuthenticated, userController.updateProfilePic);
router.put("/updateCoverPic", upload.single("file"), errorHandler, isAuthenticated, userController.updateCoverPic);

router.get("/profile-details/:uid", isAuthenticated, userController.profileDetails);

// Route to delete an existing author
// Not DONE
router.delete("/delete", isAuthenticated, userController.user_delete);

// ################### Blog Posts #############################
// Will show all published and draft posts if logged in

// router.get("/posts", isAuthenticated, userController.index);

// ################### Single Post #############################
// Create single post

// router.post("/posts", upload.single("file"), errorHandler, isAuthenticated, userController.post_create);

// Show single post

// router.get("/posts/:id", isAuthenticated, userController.post_show);
// Update single post

// router.put("/posts/:id", upload.single("file"), errorHandler, isAuthenticated, userController.post_edit);
// Delete single post

// router.delete("/posts/:id", isAuthenticated, userController.post_delete);

router.post("/follow/:followingId", isAuthenticated, followerController.follow);

router.post("/unfollow/:unfollowingId", isAuthenticated, followerController.unfollow);

router.post("/sendFriendRequest/:friendId", isAuthenticated, followerController.sendFriendRequest);

router.post("/cancelFriendRequest/:friendId", isAuthenticated, followerController.cancelFriendRequest);
router.post("/acceptFriendRequest/:friendId", isAuthenticated, followerController.acceptFriendRequest);
router.post("/rejectFriendRequest/:friendId", isAuthenticated, followerController.rejectFriendRequest);
router.post("/deleteFriend/:friendId", isAuthenticated, followerController.deleteFriend);

router.get("/peopleDetails", isAuthenticated, followerController.getAllUsers);

module.exports = router;
