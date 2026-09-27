const express = require("express");

const {
    googleLogin,
    register,
    login,
    updateProfile
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

module.exports = router;