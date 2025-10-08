import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password!
      },
    });

    await transporter.sendMail({
      from: `"MoviePie" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
    });

    console.log("✅ OTP email sent:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new apierror(500, "Failed to send OTP email. Check SMTP credentials.");
  }
};