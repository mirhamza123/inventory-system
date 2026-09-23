import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;
    const targetUserId = req.user?.id || userId;

    if (!targetUserId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const storedPassword = user.password || "";
    const isHashMatch = await bcrypt.compare(currentPassword, storedPassword);
    const isPlainTextMatch = storedPassword === currentPassword;

    if (!isHashMatch && !isPlainTextMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Unable to update password.",
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userCount === 0 ? "admin" : "cashier",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "inventory-pro-secret-key",
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
