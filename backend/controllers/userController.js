import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, picture, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, and Role are required",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { name, picture, role },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "User registered/login successful",
      data: user,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v -updatedAt");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v -updatedAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};
