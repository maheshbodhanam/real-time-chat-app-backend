const verifyToken = require("../helpers/verifyToken");

async function userDetails(request, response) {
  try {
    const token = request.cookies.token || "";

    const user = await verifyToken(token);

    return response.status(200).json({
      msg: "user details",
      data: user,
    });
  } catch (error) {
    return response.status(500).json({
      msg: error.message || error,
      error: true,
    });
  }
}

module.exports = userDetails;
