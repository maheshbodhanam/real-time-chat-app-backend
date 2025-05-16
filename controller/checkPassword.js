const UserModel = require("../models/UserModel");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function checkPassword(req, res) {
  try {
    const { password, userId } = req.body;

    const user = await UserModel.findById(userId);

    const verifyPassword = await bcryptjs.compare(password, user.password);

    if (!verifyPassword) {
      return res.status(400).json({
        msg: "Please check password",
        error: true,
      });
    }

    // Generate a token for the session
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const cookieOptions = {
      http: true,
      secure: true,
      sameSite: "None",
    };

    const userDetails = await UserModel.findById(userId).select("-password");

    return res.cookie("token", token, cookieOptions).status(200).json({
      success: true,
      msg: "Sign-In successful",
      data: userDetails,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: error.msg || error, error: true });
  }
}

module.exports = checkPassword;
