const express = require("express");

const {
    uploadProductImage,
    deleteProductImage
} = require("../controllers/uploadController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
    "/product-image",
    authMiddleware,
    roleMiddleware("ADMIN"),
    upload.single("image"),
    uploadProductImage
);

router.delete(
    "/product-image",
    authMiddleware,
    roleMiddleware("ADMIN"),
    deleteProductImage
);

module.exports = router;