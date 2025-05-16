const UserModel = require("../models/UserModel");

async function updateUserDetails(req, res) {
  try {
    const { name, userId } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        msg: "Name is required",
        success: false,
      });
    }

    // Update user details
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name },
      { new: true } // Return the modified document
    );

    if (updatedUser.modifiedCount === 0) {
      return res.status(404).json({
        msg: "User not found or no changes made",
        success: false,
      });
    }

    return res.status(200).json({
      msg: "User updated successfully",
      data: updatedUser,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      msg: error.message || error,
      success: false,
    });
  }
}

module.exports = updateUserDetails;
