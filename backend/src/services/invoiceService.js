const PDFDocument = require("pdfkit");
const path = require("path");

const generateInvoiceBuffer = (order) => {

    return new Promise((resolve, reject) => {

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });

        const chunks = [];

        doc.on("data", (chunk) => {
            chunks.push(chunk);
        });

        doc.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        doc.on("error", (error) => {
            reject(error);
        });

        const pageWidth = 595.28;
        const leftMargin = 50;
        const rightMargin = 545;
        const contentWidth = 495;

        // --------------------------------------------------
        // Logo
        // --------------------------------------------------

        const logoPath = path.join(
            __dirname,
            "../../../frontend/public/favicon.png"
        );

        // --------------------------------------------------
        // Header
        // --------------------------------------------------

        doc.image(
            logoPath,
            leftMargin,
            45,
            {
                width: 48,
                height: 48
            }
        );

        doc
            .fontSize(23)
            .font("Helvetica-Bold")
            .fillColor("#6B3F25")
            .text(
                "RAAMATHY SWEETS",
                leftMargin + 60,
                47
            );

        doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#777777")
            .text(
                "Homemade • Fresh • Traditional",
                leftMargin + 60,
                76
            );

        doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .fillColor("#222222")
            .text(
                "INVOICE",
                400,
                52,
                {
                    width: 145,
                    align: "right"
                }
            );

        // Brand accent line

        doc
            .moveTo(leftMargin, 105)
            .lineTo(rightMargin, 105)
            .lineWidth(1.5)
            .strokeColor("#6B3F25")
            .stroke();

        // --------------------------------------------------
        // Order Information
        // --------------------------------------------------

        doc
            .roundedRect(
                leftMargin,
                120,
                contentWidth,
                58,
                6
            )
            .fillColor("#F8F5F2")
            .fill();

        // Order Number

        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#777777")
            .text(
                "ORDER NUMBER",
                65,
                132
            );

        doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#222222")
            .text(
                order.orderNumber,
                65,
                147
            );

        // Order Date

        const orderDate =
            new Date(order.createdAt);

        const formattedDate =
            orderDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#777777")
            .text(
                "ORDER DATE",
                250,
                132
            );

        doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#222222")
            .text(
                formattedDate,
                250,
                147
            );

        // Status

        const formattedStatus =
            order.status
                .replace(/_/g, " ");

        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#777777")
            .text(
                "STATUS",
                400,
                132
            );

        doc
            .roundedRect(
                395,
                145,
                150,
                22,
                5
            )
            .fillColor("#EFE8E2")
            .fill();

        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#6B3F25")
            .text(
                formattedStatus,
                400,
                152,
                {
                    width: 140,
                    align: "center",
                    lineBreak: false
                }
            );

        // --------------------------------------------------
        // Customer
        // --------------------------------------------------

        doc
            .fontSize(13)
            .font("Helvetica-Bold")
            .fillColor("#6B3F25")
            .text(
                "BILL TO",
                leftMargin,
                205
            );

        doc
            .moveTo(leftMargin, 225)
            .lineTo(
                leftMargin + 55,
                225
            )
            .lineWidth(1)
            .strokeColor("#6B3F25")
            .stroke();

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#222222")
            .text(
                order.customerName,
                leftMargin,
                238
            );

        doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#555555")
            .text(
                order.phone,
                leftMargin,
                255
            );

        doc
            .fontSize(10)
            .text(
                order.address,
                leftMargin,
                272,
                {
                    width: contentWidth
                }
            );

        // --------------------------------------------------
        // Items Table
        // --------------------------------------------------

        const tableTop = 315;

        // Table Header Background

        doc
            .roundedRect(
                leftMargin,
                tableTop - 8,
                contentWidth,
                30,
                5
            )
            .fillColor("#6B3F25")
            .fill();

        doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .fillColor("#FFFFFF");

        doc.text(
            "ITEM",
            leftMargin + 12,
            tableTop
        );

        doc.text(
            "QTY",
            330,
            tableTop,
            {
                width: 45,
                align: "center"
            }
        );

        doc.text(
            "PRICE",
            395,
            tableTop,
            {
                width: 65,
                align: "right"
            }
        );

        doc.text(
            "TOTAL",
            480,
            tableTop,
            {
                width: 55,
                align: "right"
            }
        );

        // --------------------------------------------------
        // Items
        // --------------------------------------------------

        let currentY =
            tableTop + 38;

        order.items.forEach((item, index) => {

            doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor("#222222")
                .text(
                    item.productName,
                    leftMargin + 5,
                    currentY,
                    {
                        width: 255
                    }
                );

            doc
                .fontSize(10)
                .text(
                    String(item.quantity),
                    330,
                    currentY,
                    {
                        width: 45,
                        align: "center"
                    }
                );

            doc
                .text(
                    `Rs. ${item.price.toFixed(2)}`,
                    395,
                    currentY,
                    {
                        width: 65,
                        align: "right"
                    }
                );

            doc
                .font("Helvetica-Bold")
                .text(
                    `Rs. ${item.subtotal.toFixed(2)}`,
                    480,
                    currentY,
                    {
                        width: 55,
                        align: "right"
                    }
                );

            currentY += 30;

            // Item separator

            doc
                .moveTo(
                    leftMargin,
                    currentY - 10
                )
                .lineTo(
                    rightMargin,
                    currentY - 10
                )
                .lineWidth(0.5)
                .strokeColor("#DDDDDD")
                .stroke();
        });

        // --------------------------------------------------
        // Total
        // --------------------------------------------------

        currentY += 15;

        doc
            .roundedRect(
                320,
                currentY - 8,
                225,
                48,
                6
            )
            .fillColor("#F8F5F2")
            .fill();

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#555555")
            .text(
                "TOTAL AMOUNT",
                335,
                currentY + 7,
                {
                    width: 105,
                    align: "left"
                }
            );

        doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .fillColor("#6B3F25")
            .text(
                `Rs. ${order.totalAmount.toFixed(2)}`,
                445,
                currentY + 4,
                {
                    width: 85,
                    align: "right"
                }
            );

        // --------------------------------------------------
        // Thank You Section
        // --------------------------------------------------

        const footerLineY = 700;

        doc
            .moveTo(leftMargin, footerLineY)
            .lineTo(rightMargin, footerLineY)
            .lineWidth(1)
            .strokeColor("#E0D8D2")
            .stroke();

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#6B3F25")
            .text(
                "Thank you for ordering from Raamathy Sweets!",
                leftMargin,
                footerLineY + 18,
                {
                    width: contentWidth,
                    align: "center"
                }
            );

        doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#555555")
            .text(
                "For any queries regarding your order, please contact us.",
                leftMargin,
                footerLineY + 38,
                {
                    width: contentWidth,
                    align: "center"
                }
            );

        // --------------------------------------------------
        // Contact Number
        // --------------------------------------------------

        doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#222222")
            .text(
                "Contact: +91 95003 01100",
                leftMargin,
                footerLineY + 55,
                {
                    width: contentWidth,
                    align: "center"
                }
            );

        // --------------------------------------------------
        // Footer
        // --------------------------------------------------

        doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#888888")
            .text(
                "Homemade • Fresh • Traditional",
                leftMargin,
                770,
                {
                    width: contentWidth,
                    align: "center"
                }
            );

        doc
            .fontSize(7)
            .fillColor("#AAAAAA")
            .text(
                "This is a computer-generated invoice.",
                leftMargin,
                783,
                {
                    width: contentWidth,
                    align: "center"
                }
            );

        doc.end();
    });
};


// --------------------------------------------------
// Used by the browser download endpoint
// --------------------------------------------------

const generateInvoice = async (order, res) => {

    try {

        const pdfBuffer =
            await generateInvoiceBuffer(order);

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${order.orderNumber}.pdf"`
        );

        res.send(pdfBuffer);

    } catch (error) {

        console.error(
            "Invoice generation error:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({
                success: false,
                message: "Unable to generate invoice"
            });

        }

    }

};


module.exports = {
    generateInvoice,
    generateInvoiceBuffer
};