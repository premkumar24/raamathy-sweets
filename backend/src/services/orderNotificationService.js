const { Resend } = require("resend");
const { generateInvoiceBuffer } = require("./invoiceService");
const resend = new Resend(
    process.env.RESEND_API_KEY
);

const notifyNewOrder = async (order) => {

    try {

        const itemsHtml = order.items
            .map(
                (item) => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            ${item.productName}
                        </td>

                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                            ${item.quantity}
                        </td>

                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                            Rs. ${item.subtotal.toFixed(2)}
                        </td>
                    </tr>
                `
            )
            .join("");

        const html = `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 650px;
                margin: auto;
                padding: 20px;
            ">

                <h1 style="
                    color: #8b4513;
                    margin-bottom: 5px;
                ">
                    🛍️ New Order Received
                </h1>

                <p>
                    A new order has been placed on
                    <strong>Raamathy Sweets</strong>.
                </p>

                <hr>

                <h2>
                    Order Details
                </h2>

                <p>
                    <strong>Order Number:</strong>
                    ${order.orderNumber}
                </p>

                <p>
                    <strong>Status:</strong>
                    Awaiting Confirmation
                </p>

                <h2>
                    Customer Details
                </h2>

                <p>
                    <strong>Name:</strong>
                    ${order.customerName}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${order.phone}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${order.address}
                </p>

                <h2>
                    Ordered Items
                </h2>

                <table
                    style="
                        width: 100%;
                        border-collapse: collapse;
                    "
                >
                    <thead>
                        <tr>
                            <th
                                style="
                                    padding: 8px;
                                    text-align: left;
                                    border-bottom: 2px solid #333;
                                "
                            >
                                Item
                            </th>

                            <th
                                style="
                                    padding: 8px;
                                    text-align: center;
                                    border-bottom: 2px solid #333;
                                "
                            >
                                Qty
                            </th>

                            <th
                                style="
                                    padding: 8px;
                                    text-align: right;
                                    border-bottom: 2px solid #333;
                                "
                            >
                                Amount
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <h2 style="text-align: right;">
                    Total: Rs. ${order.totalAmount.toFixed(2)}
                </h2>

                <hr>

                <p style="
                    color: #777;
                    font-size: 13px;
                ">
                    Please review the order and contact the
                    customer to confirm the order and delivery
                    details.
                </p>

            </div>
        `;

        const pdfBuffer =
    await generateInvoiceBuffer(order);

const { data, error } =
    await resend.emails.send({

        from:
            "Raamathy Sweets <onboarding@resend.dev>",

        to: [
            process.env.ADMIN_EMAIL
        ],

        subject:
            `New Order - ${order.orderNumber}`,

        html,

        attachments: [
            {
                filename:
                    `${order.orderNumber}.pdf`,

                content:
                    pdfBuffer
            }
        ]

    });

        if (error) {

            console.error(
                "Resend email error:",
                error
            );

            return;
        }

        console.log(
            "Admin email sent successfully:",
            data
        );

    } catch (error) {

        console.error(
            "Order email notification error:",
            error
        );

    }
};



module.exports = {
    notifyNewOrder
};