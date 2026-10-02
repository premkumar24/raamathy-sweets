const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    createPayment,checkPaymentStatus,handleCashfreeWebhook
} = require("../controllers/paymentController");

const router = express.Router();

router.post(
    "/create",
    authMiddleware,
    createPayment
);

router.get(
    "/:orderId/status",
    authMiddleware,
    checkPaymentStatus
);

router.post(
    "/webhook",
    handleCashfreeWebhook
);

module.exports = router;