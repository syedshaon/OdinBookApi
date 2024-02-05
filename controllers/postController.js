const User = require("../models/userModel");
const Post = require("../models/postModel");
const BlackJWT = require("../models/blackjwt");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const fs = require("fs");

const { sendConfirmationEmail, sendResetPWEmail } = require("./services/sendMail");
const { verifyToken, verifyRefreshToken } = require("./services/verifyToken");
const { generateToken, generateRefreshToken } = require("./services/generateToken");

const postController = {
  // Update an existing author
  async post_create(req, res, next) {
    const user = req.user;
    try {
      const { text } = req.body;
      if (text.length > 200) {
        return res.status(400).json({ message: "Post's max character lenth is 200." });
      }
      const authorId = user._id; // Assuming you have user information stored in req.user after authentication

      if (!text && !req.file) {
        return res.status(400).json({ message: "Post should have image or text content." });
      }
      if (text.replace(/\s/g, "").length == 0 && !req.file) {
        return res.status(400).json({ message: "Post should have image or text content." });
        return;
      }
      // Create a new post
      const newPost = new Post({
        text: text,
        thumbnail: req.file ? req.file.buffer.toString("base64") : "", // Assuming you want to store the thumbnail as a base64 string
        author: authorId,
      });

      // Save the post
      const savedPost = await newPost.save();

      // Update the author's posts array
      user.posts.push(savedPost._id);
      await user.save();

      res.status(201).json(savedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async addComment(req, res, next) {
    const { postId } = req.params;
    const { text } = req.body;

    if (text > 100) {
      return res.status(400).json({ message: "Comment's max character lenth is 100." });
    }

    try {
      // Find the post by postId
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Create a new comment object
      const newComment = {
        text,
        provider: req.user._id, // Assuming you have user information stored in req.user after authentication
        time: new Date(),
      };

      // Add the new comment to the post's comments array
      post.comments.push(newComment);

      // Save the updated post
      await post.save();

      // const modifiedPost = await Post.findById(postId).populate({
      //   path: "comments.provider",
      //   select: "firstName lastName profilePicture", // Select the fields you want to include
      // });

      const modifiedPost = await post.populate({
        path: "comments.provider",
        select: "firstName lastName username profilePicture", // Select the fields you want to include
      });

      // Optionally, you can populate the provider field to get user details in the response
      // await post.populate("comments.provider", "username profilePicture").execPopulate();

      // Return the updated post with the new comment
      // res.status(201).json(newComment);
      res.status(201).json({ post: modifiedPost });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  async toggleLike(req, res, next) {
    const userId = req.user._id;
    console.log(req.user._id);
    const { postId } = req.params;

    try {
      // Find the post by postId
      const existingPost = await Post.findById(postId);
      const likeExists = existingPost.likes.some((like) => like.provider.toString() === userId.toString());

      if (likeExists) {
        await Post.findByIdAndUpdate(
          postId,
          { $pull: { likes: { provider: userId } } },
          { new: true } // Return updated document
        );
      } else {
        await Post.findByIdAndUpdate(
          postId,
          { $addToSet: { likes: { provider: userId } } },
          { new: true } // Return updated document
        );
      }

      // const isLiked = post.likes.includes(userId);

      // if (isLiked) {
      //   // If liked, remove the like
      //   await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      // } else {
      //   // If not liked, add the like
      //   await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
      // }

      res.status(200).json({ message: "Like toggled successfully" });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  async followedUsersPosts(req, res, next) {
    try {
      const currentUser = req.user;
      const followingIds = currentUser.following.map((user) => user._id);
      // Get posts from users in the following list
      const posts = await Post.find({ author: { $in: followingIds } })
        .populate({
          path: "author",
          select: "username firstName lastName profilePicture",
        })
        .populate({
          path: "comments",
          populate: {
            path: "provider",
            select: "username firstName lastName profilePicture",
          },
        })
        .populate({
          path: "likes.provider",
          select: "username firstName lastName profilePicture",
        });

      res.json({ posts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = postController;
