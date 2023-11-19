var express = require("express");
var router = express.Router();
const { authorController, isAuthenticated } = require("../controllers/author_Ctrl");

router.get("/test", isAuthenticated, authorController.test);
// ################### Sign Up #############################
//  DONE
router.post("/signup", authorController.signup);

// ################### Sign In #############################
//  DONE
router.post("/signin", authorController.signin);

// ###################  Sign Out  ###############################
//  DONE
router.post("/signout", authorController.signout);

// ################### update an existing author #############################
// Route to update an existing author
//  DONE
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
router.post("/posts", isAuthenticated, authorController.post_create);

// Show single post
//  DONE
router.get("/posts/:id", isAuthenticated, authorController.post_show);
// Update single post
//  DONE
router.put("/posts/:id", isAuthenticated, authorController.post_edit);
// Delete single post
//  DONE
router.delete("/posts/:id", isAuthenticated, authorController.post_delete);

module.exports = router;
