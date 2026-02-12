'use server';

type Lead = {
    name: string;
    phoneNumber: string;
    serviceNeeded: string;
    preferredBidTime: string;
};

export async function sendLeadNotificationSms(lead: Lead) {
  const recipientPhoneNumber = '208-831-6824';
  const message = `
    New Lead from R&W Property Solutions Website:
    Name: ${lead.name}
    Phone: ${lead.phoneNumber}
    Service: ${lead.serviceNeeded}
    Preferred Time: ${lead.preferredBidTime || 'Not specified'}
  `;

  // TODO: Implement Twilio (or other SMS provider) API call here.
  // You will need to install the Twilio package (npm install twilio)
  // and configure your Account SID, Auth Token, and Twilio phone number
  // as environment variables.

  console.log('--- SENDING SMS ---');
  console.log(`To: ${recipientPhoneNumber}`);
  console.log(`Message: ${message}`);
  console.log('-------------------');
  console.log('NOTE: SMS not actually sent. Implement a real SMS service.');

  // Example with Twilio (once configured):
  /*
  import Twilio from 'twilio';

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Twilio environment variables are not configured.');
    return;
  }

  const client = new Twilio(accountSid, authToken);

  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: recipientPhoneNumber,
    });
    console.log('SMS notification sent successfully.');
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
  }
  */
  
  return Promise.resolve();
}
