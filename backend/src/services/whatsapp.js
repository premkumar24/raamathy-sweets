const axios = require("axios");

async function sendWhatsAppText(
    recipientPhone,
    message
) {
    const accessToken =
        process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID;

    const url =
        `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

    const response = await axios.post(
        url,
        {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "text",
            text: {
                body: message
            }
        },
        {
            headers: {
                Authorization:
                    `Bearer ${accessToken}`,

                "Content-Type":
                    "application/json"
            }
        }
    );

    return response.data;
}

module.exports = {
    sendWhatsAppText
};