const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const googleSignIn = async (req, res) => {
  const { name, email } = req.body;

  try {
    // Check if the user already exists
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Create a new user with Google data if not found
      user = new UserModel({
        name,
        email,
        password:
          "$2a$10$8M4NMBBTZG57WmnpcS7JOey5kY2h1otaEBl5xDYHHHYzVo03zRANS",
        isVerified: true,
        googleSignin: true,
      });
      await user.save();
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

    return res.cookie("token", token, cookieOptions).status(200).json({
      success: true,
      msg: "Google Sign-In successful",
      data: user,
      token,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: true });
  }
};

module.exports = googleSignIn;
