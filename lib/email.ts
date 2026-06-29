import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn("⚠️ EMAIL_USER or EMAIL_APP_PASSWORD not found in .env. Logging email instead:");
    console.log(`--- Email Intercepted ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    console.log(`-----------------------`);
    return true; // Simulate success if no credentials (good for local dev without setup)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this if using another provider
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: `"Billing System" <${emailUser}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  return true;
}
