// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,            // Use 465 for SSL
      secure: true,   
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"MoviePie" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: message,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(" Email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error(" Email sending failed:", error.message);
    throw error;
  }
};