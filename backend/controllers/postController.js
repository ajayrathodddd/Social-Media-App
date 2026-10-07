const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// Upload image buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "social-media-app",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// Get all posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture")
      .sort({ createdAt: -1 });

    // Fix old records where profile and post images
    // were accidentally stored in the wrong fields.
    for (const post of posts) {
      const profilePicture = post.user?.profilePicture || "";
      const postImage = post.image || "";

      const profileHasPostFolder =
        profilePicture.includes("/social-media-app/");

      const postHasProfileFolder =
        postImage.includes("/social-media-profile-pictures/");

      if (profileHasPostFolder && postHasProfileFolder) {
        const oldProfileImage = profilePicture;
        const oldPostImage = postImage;

        // Put the actual profile image back into User.profilePicture
        await User.findByIdAndUpdate(post.user._id, {
          profilePicture: oldPostImage,
        });

        // Update the returned post immediately
        post.user.profilePicture = oldPostImage;

        // Put the actual post image back into Post.image
        await Post.findByIdAndUpdate(post._id, {
          image: oldProfileImage,
        });

        // Update the returned post immediately
        post.image = oldProfileImage;
      }
    }

    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// Get posts of a specific user
const getUserPosts = async (req, res) => {
  const posts = await Post.find({ user: req.params.id })
    .populate("user", "username profilePicture")
    .populate("comments.user", "username profilePicture")
    .sort({ createdAt: -1 });

  res.json(posts);
};

// Create a new post
const createPost = async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Post content is required");
  }

  let imageUrl = "";

  // Upload image to Cloudinary if an image was selected
  if (req.file) {
    try {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadedImage.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500);
      throw new Error("Image upload failed");
    }
  }

  const post = await Post.create({
    user: req.user._id,
    content: content.trim(),
    image: imageUrl,
  });

  const populatedPost = await post.populate(
    "user",
    "username profilePicture"
  );

  res.status(201).json(populatedPost);
};

// Add comment
const addComment = async (req, res) => {
  const { content } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Comment content is required");
  }

  post.comments.push({
    user: req.user._id,
    content: content.trim(),
  });

  await post.save();

  // Populate separately because populate() is asynchronous
  await post.populate("user", "username profilePicture");
  await post.populate("comments.user", "username profilePicture");

  res.status(201).json(post);
};

// Like / unlike post
const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id).select("likes");

  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  const userId = req.user._id.toString();

  const liked = post.likes.some(
    (id) => id.toString() === userId
  );

  const update = liked
    ? { $pull: { likes: req.user._id } }
    : { $addToSet: { likes: req.user._id } };

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    update,
    {
      new: true,
    }
  ).select("likes");

  res.json({
    liked: !liked,
    likes: updatedPost.likes.length,
  });
};

// Delete post
const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this post");
  }

  await post.deleteOne();

  res.json({
    message: "Post removed",
  });
};

// Save post
const savePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  await require("../models/User").findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        savedPosts: post._id,
      },
    }
  );

  res.json({
    message: "Post saved",
    postId: post._id,
  });
};

// Unsave post
const unsavePost = async (req, res) => {
  await require("../models/User").findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        savedPosts: req.params.id,
      },
    }
  );

  res.json({
    message: "Post unsaved",
    postId: req.params.id,
  });
};

// Get saved posts
const getSavedPosts = async (req, res) => {
  const user = await require("../models/User")
    .findById(req.user._id)
    .populate({
      path: "savedPosts",
      populate: [
        {
          path: "user",
          select: "username profilePicture",
        },
        {
          path: "comments.user",
          select: "username profilePicture",
        },
      ],
    });

  res.json(user?.savedPosts || []);
};

module.exports = {
  getPosts,
  getUserPosts,
  createPost,
  addComment,
  toggleLike,
  deletePost,
  savePost,
  unsavePost,
  getSavedPosts,
};