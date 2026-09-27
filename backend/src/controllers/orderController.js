const Order = require("../models/Order");
const Product = require("../models/Product");
const { notifyNewOrder } = require("../services/orderNotificationService");
const mongoose = require("mongoose");
const { generateInvoice } = require("../services/invoiceService");

const createOrder = async (req, res) => {
    try {
        const {
            customerName,
            phone,
            address,
            items
        } = req.body;

        if (
            !customerName ||
            !phone ||
            !address ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer name, phone, address and items are required"
            });
        }

        const orderItems = [];

        for (const item of items) {

            if (
                !item.productId ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order item"
                });
            }

            const product =
                await Product.findById(
                    item.productId
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Product not found: ${item.productId}`
                });
            }

            if (
                !product.isAvailable ||
                product.stock < item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name} is not available in the requested quantity`
                });
            }

            const subtotal =
                product.price * item.quantity;

            orderItems.push({
                productId: product._id,
                productName: product.name,
                imageUrl: product.imageUrl,
                quantity: item.quantity,
                price: product.price,
                subtotal
            });
        }

        const totalAmount =
            orderItems.reduce(
                (total, item) =>
                    total + item.subtotal,
                0
            );

        const orderNumber =
            `RS-${Date.now()}`;

        const order = await Order.create({
            orderNumber,
            userId: req.user.userId,
            items: orderItems,
            totalAmount,
            customerName,
            phone,
            address
        });

        try {
            await notifyNewOrder(order);
        } catch (notificationError) {
            console.error(
                "Order notification failed:",
                notificationError
            );
        }

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                {
                    $inc: {
                        stock: -item.quantity
                    }
                }
            );
        }

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });

    } catch (error) {

        console.error(
            "Create order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create order"
        });
    }
};

const getOrders = async (req, res) => {

    try {

        const orders = await Order
            .find()
            .sort({ createdAt: -1 });

        res.status(200).json({

            success: true,

            count: orders.length,

            orders

        });

    } catch (error) {

        console.error(
            "Get orders error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to get orders"

        });

    }

};

const getMyOrders = async (req, res) => {

    try {

        const orders = await Order
            .find({
                userId: req.user.userId
            })
            .sort({
                createdAt: -1
            });

        res.status(200).json({

            success: true,

            count: orders.length,

            orders

        });

    } catch (error) {

        console.error(
            "Get my orders error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to get your orders"

        });

    }

};

const downloadInvoice = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Customer can download only their own invoice
        if (
            order.userId &&
            order.userId.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to access this invoice"
            });
        }

        generateInvoice(order, res);

    } catch (error) {

        console.error(
            "Download invoice error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to generate invoice"
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "AWAITING_CONFIRMATION",
            "CONFIRMED",
            "PROCESSING",
            "READY_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ];

        const allowedTransitions = {
            AWAITING_CONFIRMATION: [
                "CONFIRMED",
                "CANCELLED"
            ],

            CONFIRMED: [
                "PROCESSING",
                "CANCELLED"
            ],

            PROCESSING: [
                "READY_FOR_DELIVERY",
                "CANCELLED"
            ],

            READY_FOR_DELIVERY: [
                "DELIVERED",
                "CANCELLED"
            ],

            DELIVERED: [],

            CANCELLED: []
        };

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order =
            await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            !allowedTransitions[order.status]
                .includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot change order status from ${order.status} to ${status}`
            });
        }

        // Prevent changing an already cancelled order
        if (order.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message:
                    "A cancelled order cannot be updated"
            });
        }

        // Restore stock when order is cancelled
        if (status === "CANCELLED") {

            for (const item of order.items) {

                await Product.findByIdAndUpdate(
                    item.productId,
                    {
                        $inc: {
                            stock: item.quantity
                        }
                    }
                );
            }
        }

        order.status = status;

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                "Order status updated successfully",
            order
        });

    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update order status"
        });
    }
};

module.exports = {
    createOrder, getOrders, getMyOrders, updateOrderStatus, downloadInvoice
};