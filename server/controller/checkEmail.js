const UserModel = require("../models/UserModel");

async function checkEmail(request, response) {
  try {
    const { email } = request.body;

    const user = await UserModel.findOne({ email }).select("-password");

    if (!user) {
      return response.status(404).json({
        msg: "User does not exist",
        error: true,
      });
    }

    return response.status(200).json({
      msg: user?.isVerified ? "email verified" : "Please verify email",
      success: true,
      data: user,
    });
  } catch (error) {
    return response.status(500).json({
      msg: error.msg || error,
      error: true,
    });
  }
}

module.exports = checkEmail;
