const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const verifyToken = async (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      throw new Error("Invalid token");
    }

    const user = await UserModel.findById(decoded.userId).select("-password");

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};

module.exports = verifyToken;
