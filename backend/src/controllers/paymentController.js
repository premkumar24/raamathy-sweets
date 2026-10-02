const Order = require("../models/Order");
const Product = require("../models/Product");
const {
    notifyNewOrder
} = require("../services/orderNotificationService");

const {
    Cashfree,
    CFEnvironment
} = require("cashfree-pg");

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

const {
    createPaymentOrder,
    getPaymentStatus
} = require("../services/paymentService");


// ============================================================
// CREATE PAYMENT
// ============================================================

const createPayment = async (req, res) => {

    try {

        const {
            orderId
        } = req.body;

        if (!orderId) {

            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });

        }

        /*
         * Find the existing Raamathy order
         * belonging to the logged-in customer.
         */
        const order =
            await Order.findOne({
                orderNumber: orderId,
                userId: req.user.userId
            });

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        /*
         * Do not allow payment again
         * after successful payment.
         */
        if (
            order.payment?.status === "SUCCESS"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "This order has already been paid"
            });

        }

        /*
         * Do not allow cancelled orders
         * to be paid.
         */
        if (
            order.status === "CANCELLED"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Payment is not available for cancelled orders"
            });

        }

        /*
         * Create a UNIQUE Cashfree order ID
         *
         * This is NOT a new Raamathy order.
         * It is only a new Cashfree payment attempt.
         */
        const cashfreeOrderId =
            `${order.orderNumber}-PAY-${Date.now()}`;

        /*
         * Create Cashfree order.
         */
        const paymentOrder =
            await createPaymentOrder({

                orderId:
                    cashfreeOrderId,

                /*
                 * Always use the amount
                 * stored in our database.
                 */
                orderAmount:
                    order.totalAmount,

                customerName:
                    order.customerName,

                customerPhone:
                    order.phone,

                customerEmail:
                    req.user.email || ""

            });

        /*
         * Save the EXACT Cashfree order ID
         * that we created.
         *
         * Do NOT use order.orderNumber here.
         */
        order.payment.gateway =
            "cashfree";

        order.payment.gatewayOrderId =
            cashfreeOrderId;

        /*
         * A new payment attempt is pending.
         *
         * This also changes FAILED -> PENDING
         * when the customer retries payment.
         */
        order.payment.status =
            "PENDING";

        await order.save();

        console.log(
            "CASHFREE PAYMENT CREATED:",
            {
                raamathyOrderId:
                    order.orderNumber,

                cashfreeOrderId:
                    cashfreeOrderId,

                paymentSessionId:
                    paymentOrder.payment_session_id
            }
        );

        return res.status(200).json({

            success: true,

            paymentSessionId:
                paymentOrder.payment_session_id,

            paymentOrder

        });

    } catch (error) {

        console.error(
            "CREATE PAYMENT ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create payment order"

        });

    }

};


// ============================================================
// HANDLE SUCCESSFUL PAYMENT
// ============================================================

const handleSuccessfulPayment = async (
    order,
    transactionId,
    paidAt
) => {

    /*
     * Prevent duplicate payment processing.
     *
     * Both:
     * - status checking
     * - webhook
     *
     * can reach this function.
     */
    if (
        order.payment?.status === "SUCCESS"
    ) {

        return;

    }


    /*
     * Mark payment successful.
     */
    order.payment.status =
        "SUCCESS";

    order.payment.transactionId =
        String(transactionId || "");

    order.payment.paidAt =
        paidAt
            ? new Date(paidAt)
            : new Date();


    /*
     * Reduce stock.
     */
    for (
        const item of order.items
    ) {

        await Product.findByIdAndUpdate(
            item.productId,
            {
                $inc: {
                    stock:
                        -item.quantity
                }
            }
        );

    }


    await order.save();


    /*
     * Notify admin only if
     * notification has not already been sent.
     */
    if (
        !order.payment.paymentNotificationSent
    ) {

        try {

            await notifyNewOrder(order);

            order.payment.paymentNotificationSent =
                true;

            await order.save();

            console.log(
                "✅ Payment notification sent:",
                order.orderNumber
            );

        } catch (
            notificationError
        ) {

            console.error(
                "❌ Payment notification failed:",
                notificationError
            );

        }

    } else {

        console.log(
            "ℹ️ Payment notification already sent:",
            order.orderNumber
        );

    }

};


// ============================================================
// CHECK PAYMENT STATUS
// ============================================================

// ============================================================
// CHECK PAYMENT STATUS
// ============================================================

// ============================================================
// CHECK PAYMENT STATUS
// ============================================================

const checkPaymentStatus = async (
    req,
    res
) => {

    try {

        const {
            orderId
        } = req.params;


        console.log(
            "======================================"
        );

        console.log(
            "CHECK PAYMENT STATUS STARTED"
        );

        console.log(
            "Order ID received from frontend:",
            orderId
        );

        console.log(
            "Logged-in User ID:",
            req.user?.userId
        );


        if (!orderId) {

            console.log(
                "❌ ORDER ID IS MISSING"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required"

            });

        }


        console.log(
            "Searching MongoDB..."
        );

        console.log(
            "Order Number:",
            orderId
        );

        console.log(
            "User ID:",
            req.user.userId
        );


        const order =
            await Order.findOne({

                userId:
                    req.user.userId,

                $or: [

                    {
                        orderNumber:
                            orderId
                    },

                    {
                        "payment.gatewayOrderId":
                            orderId
                    }

                ]

            });


        console.log(
            "MongoDB Order Found:",
            !!order
        );


        if (!order) {

            console.log(
                "❌ ORDER NOT FOUND IN MONGODB"
            );

            console.log(
                "Order Number searched:",
                orderId
            );

            console.log(
                "User ID searched:",
                req.user.userId
            );

            console.log(
                "======================================"
            );


            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        console.log(
            "✅ ORDER FOUND"
        );

        console.log(
            "Raamathy Order Number:",
            order.orderNumber
        );

        console.log(
            "MongoDB Order ID:",
            order._id
        );

        console.log(
            "Order User ID:",
            order.userId
        );

        console.log(
            "Payment Gateway:",
            order.payment?.gateway
        );

        console.log(
            "Payment Status:",
            order.payment?.status
        );

        console.log(
            "Cashfree Gateway Order ID:",
            order.payment?.gatewayOrderId
        );


        const cashfreeOrderId =
            order.payment?.gatewayOrderId;


        if (!cashfreeOrderId) {

            console.log(
                "❌ CASHFREE ORDER ID IS MISSING"
            );

            console.log(
                "Raamathy Order:",
                order.orderNumber
            );


            return res.status(400).json({

                success: false,

                message:
                    "Cashfree payment order ID is missing"

            });

        }


        console.log(
            "--------------------------------------"
        );

        console.log(
            "CALLING CASHFREE PAYMENT STATUS"
        );

        console.log(
            "Cashfree Order ID:",
            cashfreeOrderId
        );


        const payments =
            await getPaymentStatus(
                cashfreeOrderId
            );


        console.log(
            "✅ CASHFREE PAYMENT RESPONSE:"
        );

        console.log(
            payments
        );


        const successfulPayment =
            payments.find(
                payment =>
                    payment.payment_status ===
                    "SUCCESS"
            );


        console.log(
            "Successful Payment Found:",
            !!successfulPayment
        );


        if (successfulPayment) {

            console.log(
                "✅ PAYMENT SUCCESS"
            );

            console.log(
                "Cashfree Payment ID:",
                successfulPayment.cf_payment_id
            );


            await handleSuccessfulPayment(

                order,

                successfulPayment.cf_payment_id,

                successfulPayment.payment_completion_time

            );

        } else {

            const failedPayment =
                payments.find(
                    payment =>
                        payment.payment_status ===
                        "FAILED" ||
                        payment.payment_status ===
                        "USER_DROPPED"
                );


            console.log(
                "Failed Payment Found:",
                !!failedPayment
            );


            if (failedPayment) {

                console.log(
                    "❌ PAYMENT FAILED"
                );


                order.payment.status =
                    "FAILED";


                if (
                    !order.payment
                        .paymentNotificationSent
                ) {

                    try {

                        await notifyNewOrder(
                            order
                        );

                        order.payment
                            .paymentNotificationSent =
                            true;

                    } catch (
                    notificationError
                    ) {

                        console.error(
                            "Order notification failed:",
                            notificationError
                        );

                    }

                }


                await order.save();

            } else {

                console.log(
                    "⏳ PAYMENT STILL PENDING"
                );

            }

        }


        console.log(
            "Final Payment Status:",
            order.payment.status
        );

        console.log(
            "======================================"
        );


        return res.status(200).json({

            success: true,

            orderId:
                order.orderNumber,

            orderMongoId:
                order._id,

            paymentStatus:
                order.payment.status,

            transactionId:
                order.payment.transactionId,

            payments

        });


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "❌ CHECK PAYMENT STATUS ERROR:"
        );

        console.error(
            error.response?.data ||
            error.message ||
            error
        );

        console.error(
            "======================================"
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify payment"

        });

    }

};


// ============================================================
// CASHFREE WEBHOOK
// ============================================================

const handleCashfreeWebhook = async (
    req,
    res
) => {

    try {

        const signature =
            req.headers[
            "x-webhook-signature"
            ];

        const timestamp =
            req.headers[
            "x-webhook-timestamp"
            ];

        const rawBody =
            req.rawBody;

        if (
            !signature ||
            !timestamp ||
            !rawBody
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Missing webhook verification details"
            });

        }

        /*
         * Verify Cashfree webhook.
         */
        const verifiedWebhook =
            cashfree.PGVerifyWebhookSignature(
                signature,
                rawBody,
                timestamp
            );

        const webhook =
            verifiedWebhook.object;

        const eventType =
            webhook.type;

        const data =
            webhook.data;

        const cashfreeOrderId =
            data?.order?.order_id;

        const payment =
            data?.payment;

        if (
            !cashfreeOrderId ||
            !payment
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid webhook payload"
            });

        }

        /*
         * Find our Raamathy order using
         * the Cashfree order ID.
         */
        const order =
            await Order.findOne({

                "payment.gatewayOrderId":
                    cashfreeOrderId

            });

        if (!order) {

            console.error(
                "WEBHOOK ORDER NOT FOUND:",
                cashfreeOrderId
            );

            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });

        }

        /*
         * Process only successful
         * payment webhook.
         */
        if (
            eventType ===
            "PAYMENT_SUCCESS_WEBHOOK" &&

            payment.payment_status ===
            "SUCCESS"
        ) {

            await handleSuccessfulPayment(

                order,

                payment.cf_payment_id,

                payment.payment_time

            );

        }

        return res.status(200).json({

            success: true,

            message:
                "Webhook processed"

        });

    } catch (error) {

        console.error(
            "CASHFREE WEBHOOK ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        return res.status(400).json({

            success: false,

            message:
                "Webhook verification or processing failed"

        });

    }

};


module.exports = {

    createPayment,

    checkPaymentStatus,

    handleCashfreeWebhook

};