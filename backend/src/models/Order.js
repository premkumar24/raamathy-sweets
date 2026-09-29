const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        productName: {
            type: String,
            required: true
        },

        imageUrl: {
            type: String,
            default: ""
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Order must contain at least one item"
            }
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "AWAITING_CONFIRMATION",
                "CONFIRMED",
                "PROCESSING",
                "READY_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "AWAITING_CONFIRMATION"
        },
        delivery: {
            method: {
                type: String,
                enum: ["offline", "courier"],
                default: null
            },

            courierName: {
                type: String,
                default: ""
            },

            trackingId: {
                type: String,
                default: ""
            },

            trackingUrl: {
                type: String,
                default: ""
            },

            shipmentStatus: {
                type: String,
                enum: [
                    "not_shipped",
                    "in_transit",
                    "out_for_delivery",
                    "delivered"
                ],
                default: "not_shipped"
            },

            shippedAt: {
                type: Date
            },

            deliveredAt: {
                type: Date
            }
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;