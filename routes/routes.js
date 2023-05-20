const express = require("express");

const router = express.Router();

const logic = require("../controllers/logic.js");

const {
  check,
  uploadController,
  getUser,
  getUserById,
  createUser,
  uploadProfilePic,
  uploadCoverPic,
  createPost,
  getPosts,
  getPostsByUserId,
  addComment,
  getCommentsByPostId,
} = logic;

router.get("/", check);
router.get("/posts", getPosts);
router.get("/user/:id", getUserById);
router.get("/posts/:id", getPostsByUserId);
router.get("/comments/:id", getCommentsByPostId);
router.put("/user", getUser);
router.post("/user", createUser);
router.post("/uploadProfilePic", uploadProfilePic);
router.post("/upload", uploadController);
router.post("/uploadCoverPic", uploadCoverPic);
router.post("/createPost", createPost);
router.post("/addComment", addComment);

module.exports = router;
