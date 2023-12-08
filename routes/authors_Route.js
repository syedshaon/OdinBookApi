var express = require("express");
var router = express.Router();
const { authorController, isAuthenticated } = require("../controllers/author_Ctrl");

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
    cb(null, Date.now() + "~" + file.originalname);
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

// router.get("/test", isAuthenticated, authorController.test);
// ################### Sign Up #############################
//  DONE
router.post("/signup", authorController.signup);

// ################### Sign In #############################
//  DONE
router.post("/signin", authorController.signin);

// ################### Refresh Token #############################
//  DONE
router.get("/refresh", authorController.refresh);

// ################### Validate login status #############################
//  DONE
router.post("/validateLoginStatus", authorController.validateLoginStatus);

// ###################  Sign Out  ###############################
//  DONE
router.post("/signout", authorController.signout);

// ################### update an existing author #############################
// Route to update an existing author
//  DONE
router.get("/update", isAuthenticated, authorController.author_update_get);
router.put("/update", isAuthenticated, authorController.author_update);

// Route to delete an existing author
//  DONE
router.delete("/delete", isAuthenticated, authorController.author_delete);

// ################### Blog Posts #############################
// Will show all published and draft posts if logged in
//  DONE
router.get("/posts", isAuthenticated, authorController.index);

// ################### Single Post #############################
// Create single post
//  DONE
router.post("/posts", upload.single("file"), errorHandler, isAuthenticated, authorController.post_create);

// router.post("/posts", upload.single("file"), errorHandler, (req, res) => {
//   // Access the uploaded file details via req.file
//   //   return res.send("File uploaded!");
//   return res.status(201).json({ message: "File uploaded!" });
// });

// router.post("/posts", upload.single("file"), (req, res) => {
//   console.log(req.body);
//   console.log(req.file);
// });
// Show single post
//  DONE
router.get("/posts/:id", isAuthenticated, authorController.post_show);
// Update single post
//  DONE
router.put("/posts/:id", upload.single("file"), errorHandler, isAuthenticated, authorController.post_edit);
// Delete single post
//  DONE
router.delete("/posts/:id", isAuthenticated, authorController.post_delete);

module.exports = router;
