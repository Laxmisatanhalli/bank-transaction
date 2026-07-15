require('dotenv').config();
const { MailtrapClient } = require("mailtrap");

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL,
  name: "Backend Ledger",
};

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await client.send({
      from: sender,
      to: [{ email: to }],
      subject,
      text,
      html,
      category: "Backend Ledger",
    });

    console.log('Message sent:', info);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hi ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful!';
  const text = `Hello ${name},\n\nYou have successfully transferred $${amount} to account ${toAccount}.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>You have successfully transferred $${amount} to account ${toAccount}.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed';
  const text = `Hello ${name},\n\nUnfortunately, your attempt to transfer $${amount} to account ${toAccount} has failed. Please try again later or contact support for assistance.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>Unfortunately, your attempt to transfer $${amount} to account ${toAccount} has failed. Please try again later or contact support for assistance.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };