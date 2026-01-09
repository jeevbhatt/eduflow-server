import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const sendMail = async (data: EmailData) => {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "EduFlow <noreply@eduflow.jeevanbhatt.com.np>",
      to: data.to,
      subject: data.subject,
      html: data.html || `<p>${data.text || "No content provided"}</p>`,
    });

    console.log("Email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw to avoid crashing the whole request if email fails
    return null;
  }
};

export default sendMail;
