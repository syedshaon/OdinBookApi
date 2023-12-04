var express = require("express");
var router = express.Router();
const { readerController, isAuthenticated } = require("../controllers/reader_Ctrl");

// ################### Blog Posts #############################
// Will show all published posts
//  DONE
router.get("/posts", readerController.index);

// Show single post
//  DONE
router.get("/posts/:id", readerController.post_show);

// ################### Sign Up #############################
//  DONE
router.post("/signup", readerController.signup);

// ################### Sign In #############################
//  DONE
router.post("/signin", readerController.signin);

// ################### Refresh Token #############################
//  DONE
router.get("/refresh", readerController.refresh);

// ################### Validate login status #############################
//  DONE
router.post("/validateLoginStatus", readerController.validateLoginStatus);

// ###################  Sign Out  ###############################
//  DONE
router.post("/signout", readerController.signout);

// ################### update an existing author #############################
// Route to update an existing author
//  DONE
router.get("/update", isAuthenticated, readerController.author_update_get);
router.put("/update", isAuthenticated, readerController.author_update);

// Route to delete an existing author
//  DONE
router.delete("/delete", isAuthenticated, readerController.author_delete);

// ################### Single Post #############################
// Create single post
//  DONE
router.post("/posts", isAuthenticated, readerController.post_create);

// Update single post
//  DONE
router.put("/posts/:id", isAuthenticated, readerController.post_edit);
// Delete single post
//  DONE
router.delete("/posts/:id", isAuthenticated, readerController.post_delete);

module.exports = router;
