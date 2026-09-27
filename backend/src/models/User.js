const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },

        passwordHash: {
            type: String,
            default: ""
        },

        profileImage: {
            type: String,
            default: ""
        },

        phone: {
            type: String,
            default: ""
        },

        address: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: [
                "CUSTOMER",
                "ADMIN",
                "STAFF"
            ],
            default: "CUSTOMER"
        },

        authProvider: {
            type: String,
            enum: [
                "GOOGLE",
                "LOCAL"
            ],
            default: "GOOGLE"
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;