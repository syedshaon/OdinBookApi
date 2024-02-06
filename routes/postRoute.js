const { v4: uuidv4 } = require("uuid");
var express = require("express");
var router = express.Router();
const userController = require("../controllers/userController");
const isAuthenticated = require("../controllers/services/isAuthenticated");
const followerController = require("../controllers/followerController");
const postController = require("../controllers/postController");

// RELATED TO IMAGE UPLOAD WITH MULTER START
const path = require("path");

const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // cb(null, __dirname);
//     // cb(null, path.join(__dirname, '/uploads/'));
//     cb(null, "./thumbs");
//   },
//   filename: function (req, file, cb) {
//     // cb(null, new Date().toISOString() + file.originalname);
//     cb(null, uuidv4() + "~" + file.originalname);
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

// Multer storage configuration
const storage = multer.memoryStorage(); // You can change this based on your needs
// const upload = multer({ storage: storage });

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
      return res.status(401).send({ message: "Error! File size exceeds the limit (512KB)" });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      // The file type is not supported.
      return res.status(401).send({ message: "Error!  The file type is not supported." });
    }
    // Handle other Multer errors here, if needed
  } else {
    // An unknown error occurred
    console.error(err);
    return res.status(500).send({ message: "An error occurred while uploading the file" });
  }
};

// RELATED TO IMAGE UPLOAD WITH MULTER END

// ################### Blog Posts #############################
// Will show all published and draft posts if logged in

// router.get("/posts", isAuthenticated, userController.index);

// ################### Single Post #############################
// Create single post

router.post("/create", upload.single("thumbnail"), errorHandler, isAuthenticated, postController.post_create);
router.post("/addComment/:postId", isAuthenticated, postController.addComment);
router.post("/toggleLike/:postId", isAuthenticated, postController.toggleLike);
router.get("/followedUsersPosts", isAuthenticated, postController.followedUsersPosts);

// Show single post

// router.get("/posts/:id", isAuthenticated, userController.post_show);
// Update single post

// router.put("/posts/:id", upload.single("file"), errorHandler, isAuthenticated, userController.post_edit);
// Delete single post

// router.delete("/posts/:id", isAuthenticated, userController.post_delete);

module.exports = router;