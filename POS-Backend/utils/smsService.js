// SMS sending utility using Twilio
const twilio = require('twilio');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = twilio(accountSid, authToken);

const sendInvoiceSMS = async (mobile, message) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM, // your Twilio number
    to: mobile
  });
};

module.exports = { sendInvoiceSMS };
