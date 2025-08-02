import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/multer.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ✅ Create a Post (with optional image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { userId, content } = req.body;
    let imageUrl = "";

    // ✅ Upload image to Cloudinary if provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "athlinko_posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    // ✅ Create post
    const newPost = new Post({
      user: userId,
      content,
      image: imageUrl || null,
    });

    await newPost.save();
    const populatedPost = await newPost.populate("user", "name email picture");

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("❌ Post creation error:", err);
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
});

// ✅ Get All Posts (latest first)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email picture")
      .populate("comments.user", "name picture")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});

// ✅ Like / Unlike a Post
router.put("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to update like", error: err.message });
  }
});

// ✅ Add a Comment
router.post("/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = { user: userId, text };
    post.comments.push(comment);

    await post.save();
    const populatedPost = await Post.findById(req.params.id)
      .populate("user", "name picture")
      .populate("comments.user", "name picture");

    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
});

export default router;
