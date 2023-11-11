var express = require("express");
var router = express.Router();
const authorController = require("../controllers/author_Ctrl");

/* GET users posts. */

router.get("/", authorController.index);

// ################### Sign Up #############################
//  DONE
router.post("/signup", authorController.signup);

// ################### Sign In #############################
//  DONE
router.post("/signin", authorController.signin);

// ######################   Sign Out  ###############################
//
//
//

// ################### update an existing author #############################
// Route to update an existing author
//  DONE
router.put("/update", authorController.update);

// Route to delete an existing author
//  DONE
router.delete("/delete", authorController.destroy);

// ################### Blog Posts #############################

router.get("/posts", function (req, res, next) {
  // Will show all published and draft posts
  res.redirect("/");
});

router.post("/posts", function (req, res, next) {
  // Need Implementation
  res.send("Create a new post.");
});

// ################### Single Post #############################

router.get("/posts/:id", function (req, res, next) {
  // Need Implementation
  res.send("Will show single post.");
});
router.put("/posts/:id", function (req, res, next) {
  // Need Implementation
  res.send("Will update single post.");
});
router.delete("/posts/:id", function (req, res, next) {
  // Need Implementation
  res.send("Will delete single post.");
});

module.exports = router;
