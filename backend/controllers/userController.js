const User = require("../models/User");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username email profilePicture")
      .populate("following", "username email profilePicture");
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        twoFactorAuth: user.twoFactorAuth,
        followers: user.followers,
        following: user.following,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "_id username email profilePicture followers following"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: "Invalid user ID" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      if (req.file) {
        user.profilePicture = `/uploads/${req.file.filename}`;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";

    // Show all other registered users when the search box is empty.
    const filter = {
      _id: { $ne: req.user._id },
    };

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("_id username email profilePicture")
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { following: userToFollow._id },
    });
    await User.findByIdAndUpdate(userToFollow._id, {
      $addToSet: { followers: req.user._id },
    });

    res.json({ message: "User followed", userId: userToFollow._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id },
    });
    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id },
    });

    res.json({ message: "User unfollowed", userId: userToUnfollow._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "username email profilePicture"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "username email profilePicture"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  getUserById,
  updateUserProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
