const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { sendWhatsAppText } = require("./services/whatsapp");

// Load environment variables
dotenv.config({
    path: path.join(__dirname, "../.env")
});


const app = express();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// -------------------------
// Middleware
// -------------------------

app.use(cors({
    origin: [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "https://raamathy-sweets-uat.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        }
    })
);

// -------------------------
// Routes
// -------------------------

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/uploads",uploadRoutes);
app.use("/api/payments",paymentRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Raamathy Sweets API is running successfully!"
    });
});

app.get("/api/test-whatsapp", async (req, res) => {

    try {

        const result =
            await sendWhatsAppText(
                "917904074461",
                "Test message from Raamathy Sweets 🍬"
            );

        res.json({
            success: true,
            result
        });

    } catch (error) {

        console.error(
            "WHATSAPP TEST ERROR:",
            error.response?.data ||
            error.message
        );

        res.status(500).json({
            success: false,
            error:
                error.response?.data ||
                error.message
        });
    }
});

// -------------------------
// Start Server
// -------------------------

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 