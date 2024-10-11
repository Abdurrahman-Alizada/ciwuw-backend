// utils/mailer.ts
import nodemailer from "nodemailer";

export const sendAbandonedCartEmail = async (
  email: string,
  cartItems: Array<{ name: string; quantity: number }>
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-email-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "We noticed you left items in your cart!",
    html: `
            <h1>Don't forget to complete your purchase!</h1>
            <p>You left the following items in your cart:</p>
            <ul>
                ${cartItems
                  .map((item) => `<li>${item.name} - ${item.quantity}</li>`)
                  .join("")}
            </ul>
            <p><a href="https://yourwebsite.com/cart">Return to your cart</a></p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending abandoned cart email:", error);
  }
};
