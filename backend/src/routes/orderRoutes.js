const express = require("express");

const {
    createOrder,
    getOrders,
    getMyOrders,
    downloadInvoice,
    updateOrderStatus,
    updateDeliveryDetails
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createOrder
);

router.get(
    "/my-orders",
    authMiddleware,
    getMyOrders
);

router.get(
    "/:id/invoice",
    authMiddleware,
    downloadInvoice
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getOrders
);

router.put(
    "/:id/status",
    authMiddleware,
    roleMiddleware("ADMIN"),
    updateOrderStatus
);

router.put(
    "/:id/delivery",
    authMiddleware,
    roleMiddleware("ADMIN"),
    updateDeliveryDetails
);

module.exports = router;