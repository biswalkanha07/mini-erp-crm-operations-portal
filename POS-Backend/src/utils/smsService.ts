/**
 * SMS Service Utility
 * Phase 3 - Mini ERP + CRM Operations Portal
 *
 * Dispatches invoice and notification SMS messages via Twilio.
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendInvoiceSMS = async (mobile: string, message: string): Promise<any> => {
  if (!client) {
    throw new Error('Twilio credentials are not configured');
  }
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to: mobile
  });
};

export default {
  sendInvoiceSMS
};
