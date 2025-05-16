// Import required modules
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const UserModel = require("../models/UserModel");
const verifyToken = require("../helpers/verifyToken");

// Nodemailer transporter setup with environment variables
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_APP_PASSWORD, // Use App Password here
  },
});

// Register user controller
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await UserModel.findOne({ email });
    if (user)
      return res.status(400).json({ error: true, msg: "User already exists" });

    // Hash the password and create the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new UserModel({ name, email, password: hashedPassword });
    await user.save();

    // Generate email verification token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Verify your email",
      html: `<h3>Click the link to verify your account:</h3><a href="${verificationUrl}">${verificationUrl}</a>`,
    });

    return res
      .status(201)
      .json({ success: true, msg: "User registered. Check email to verify." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, msg: "Server error" });
  }
};

// Verify email controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await verifyToken(token);

    if (!user) return res.status(404).json({ msg: "User not found" });

    const userDetails = await UserModel.findById(user._id).select("-password");

    userDetails.isVerified = true;
    await userDetails.save();

    return res.status(201).json({ msg: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ msg: "Invalid or expired token" });
  }
};

module.exports = { register, verifyEmail };
