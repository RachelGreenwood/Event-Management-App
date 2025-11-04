import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

export async function sendEventUpdateEmail(recipients, eventDetails) {
  const mailOptions = {
    from: `"Event Updates" <${process.env.EMAIL_USER}>`,
    to: recipients.join(","),
    subject: `Update: ${eventDetails.title}`,
    html: `
      <h2>${eventDetails.title} has been updated!</h2>
      <p><strong>Date:</strong> ${eventDetails.date}</p>
      <p><strong>Location:</strong> ${eventDetails.location}</p>
      <p>${eventDetails.description}</p>
      <p><a href="${eventDetails.link}">View event details</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Emails sent to: ${recipients.join(", ")}`);
  } catch (err) {
    console.error("Error sending emails:", err);
  }
}