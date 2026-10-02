const {
    Cashfree,
    CFEnvironment
} = require("cashfree-pg");

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

const createPaymentOrder = async ({
    orderId,
    orderAmount,
    customerName,
    customerPhone,
    customerEmail
}) => {

    const request = {
        order_amount: orderAmount,
        order_currency: "INR",

        order_id: orderId,

        customer_details: {
            customer_id: orderId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail
        },

        order_meta: {
            return_url:
                `${process.env.FRONTEND_URL}/payment-success?cashfree_order_id={order_id}&raamathy_order_id=${orderId}`,

            notify_url:
                `${process.env.BACKEND_URL}/api/payments/webhook`
        }
    };

    const response =
        await cashfree.PGCreateOrder(request);

    return response.data;
};



const getPaymentStatus = async (
    orderId
) => {

    console.log(
        "CASHFREE PAYMENT STATUS CHECK:",
        orderId
    );

    try {

        const response =
            await cashfree.PGOrderFetchPayments(
                orderId
            );

        console.log(
            "CASHFREE PAYMENT STATUS RESPONSE:",
            response.data
        );

        return response.data;

    } catch (error) {

        console.error(
            "CASHFREE PAYMENT STATUS ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};

module.exports = {
    createPaymentOrder, getPaymentStatus
};