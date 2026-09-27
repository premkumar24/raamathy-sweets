const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const bcrypt = require("bcrypt");
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const generateToken = (user) => {

    return jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "7d"
        }
    );

};

const register = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });

        }

        const trimmedName = name.trim();
        const normalizedEmail =
            email.trim().toLowerCase();

        if (trimmedName.length < 2) {

            return res.status(400).json({
                success: false,
                message:
                    "Name must contain at least 2 characters"
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters"
            });

        }

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists"
            });

        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        const user = await User.create({

            name: trimmedName,

            email: normalizedEmail,

            passwordHash,

            authProvider: "LOCAL",

            role: "CUSTOMER"

        });

        const token =
            generateToken(user);

        res.status(201).json({

            success: true,

            message:
                "Account created successfully",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                profileImage:
                    user.profileImage,

                phone: user.phone,

                address: user.address,

                role: user.role

            }

        });

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to create account"

        });

    }

};

const googleLogin = async (req, res) => {

    try {

        const { credential } = req.body;

        if (!credential) {

            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });

        }

        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload) {

            return res.status(401).json({
                success: false,
                message: "Invalid Google credential"
            });

        }

        const {
            sub,
            name,
            email,
            picture
        } = payload;

        const existingEmailUser =
            await User.findOne({
                email: email.trim().toLowerCase()
            });

        if (
            existingEmailUser &&
            existingEmailUser.authProvider === "LOCAL"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "An account already exists with this email. Please sign in using your email and password."
            });

        }

        // Find existing user
        let user = await User.findOne({
            googleId: sub
        });

        // Create user if first login
        if (!user) {

            user = await User.create({

                googleId: sub,

                name: name || "",

                email: email || "",

                profileImage: picture || "",

                role: "CUSTOMER",

                authProvider: "GOOGLE"

            });

        }

        // Create our application JWT
        const token = generateToken(user);

        res.status(200).json({

            success: true,

            message: "Google login successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                profileImage: user.profileImage,

                phone: user.phone,

                address: user.address,

                role: user.role

            }

        });

    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        res.status(401).json({

            success: false,

            message: "Google authentication failed"

        });

    }

};

const updateProfile = async (req, res) => {

    try {

        const { phone, address } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        user.phone = phone?.trim() || "";
        user.address = address?.trim() || "";

        await user.save();

        res.status(200).json({

            success: true,

            message: "Profile updated successfully",

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                profileImage: user.profileImage,

                phone: user.phone,

                address: user.address,

                role: user.role

            }

        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Unable to update profile"

        });

    }

};

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });

        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });

        }

        if (!user.passwordHash) {

            return res.status(401).json({
                success: false,
                message:
                    "This account was created with Google. Please continue with Google to sign in."
            });

        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });

        }

        const token =
            generateToken(user);

        res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                profileImage:
                    user.profileImage,

                phone: user.phone,

                address: user.address,

                role: user.role

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to login"

        });

    }

};

module.exports = {
    googleLogin,
    register,
    login,
    updateProfile
};