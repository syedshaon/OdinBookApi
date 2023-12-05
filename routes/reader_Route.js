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
router.get("/update", isAuthenticated, readerController.reader_update_get);
router.put("/update", isAuthenticated, readerController.reader_update);

// Route to delete an existing author
//  DONE
router.delete("/delete", isAuthenticated, readerController.reader_delete);

// ################### Single Post #############################
// Create single comments
//  DONE
router.post("/comments", isAuthenticated, readerController.comments_create);

// Create single comments
//  DONE
router.get("/comments/:id", readerController.comments_get);

// Update single comments
//  DONE
router.put("/comments/:id", isAuthenticated, readerController.comments_edit);
// Delete single comments
//  DONE
router.delete("/comments/:id", isAuthenticated, readerController.comments_delete);

module.exports = router;
