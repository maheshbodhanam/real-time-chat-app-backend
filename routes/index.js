const express = require("express");
const checkEmail = require("../controller/checkEmail");
const checkPassword = require("../controller/checkPassword");
const userDetails = require("../controller/userDetails");
const logout = require("../controller/logout");
const updateUserDetails = require("../controller/updateUserDetails");
const searchUser = require("../controller/searchUser");
const { verifyEmail, register } = require("../controller/registerUser");
const googleSignIn = require("../controller/googleSignIn");
const deleteConversation = require("../controller/conversation");

const router = express.Router();

//create user api
router.post("/register", register);
//check user email
router.post("/email", checkEmail);
//check user password
router.post("/password", checkPassword);
//login user details
router.get("/user-details", userDetails);
//logout user
router.get("/logout", logout);
//update user details
router.patch("/update-user", updateUserDetails);
//search user
router.post("/search-user", searchUser);

router.get("/verify/:token", verifyEmail);

router.post("/google-signin", googleSignIn);

router.delete("/delete-conversation", deleteConversation.deleteConversation);

router.delete("/delete-msg", deleteConversation.deleteMsg);

module.exports = router;
