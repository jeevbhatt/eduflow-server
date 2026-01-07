import nodemailer from "nodemailer";

const sendMail = async (data: { to: string; subject: string; text?: string; html?: string }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_GMAIL,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw to avoid crashing the whole request if email fails (optional depending on UX)
    return null;
  }
};

export default sendMail;
