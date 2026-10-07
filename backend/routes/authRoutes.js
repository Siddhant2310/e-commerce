const express = require("express");


const router = express.Router();

const{register,login,refreshAccessToken } = require("../Controllers/authController")


router.post("/register", register)
router.post("/login", login)
router.post("/refreshAccessToken", refreshAccessToken )

module.exports = router;