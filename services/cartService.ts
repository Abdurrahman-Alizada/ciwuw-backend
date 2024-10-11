import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

import AbandonedCart from "../models/cartModal";
import { CustomerModel } from "../models/customerModal";

interface ICartItem {
  size: string;
  color: string;
  quantity: number;
  favourite: boolean;
  category: string;
  uId: string;
  _id: string;
  price: number;
  name: string;
  images: string[];
}

export const createAbandonedCart = async (
  userId: string,
  item: ICartItem // Changed from items array to a single item object
) => {
  try {
    const abandonedCart = new AbandonedCart({
      userId,
      item,
    });
    return await abandonedCart.save();
  } catch (error) {
    throw new Error("Failed to create abandoned cart");
  }
};

export const getAbandonedCarts = async () => {
  try {
    return await AbandonedCart.find();
  } catch (error) {
    throw new Error("Failed to retrieve abandoned carts");
  }
};

export const sendReminderEmail = async (
  userId: string,
  items: any[],
  timeFrame: string
) => {
  const user = await CustomerModel.findById(userId);

  // Check if user exists
  if (!user) {
    console.error(`User with ID ${userId} not found.`);
    return; // Exit the function if no user is found
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.FROM,
      pass: process.env.APP_PASSWORD,
    },
  });

  // Generate the list of cart items in HTML with inline styles
  const itemsList = items
    .map(
      (item) => `
 <li style="margin-bottom: 20px; display: flex; align-items: flex-start;">
   <img src="${item.images[0]}" alt="${
        item.name
      }" style="width: 80px; height: 80px; object-fit: cover;" />
   <div style="margin-left: 10px;">
     <strong>Product Name:</strong> ${item.name} <br/>
     <strong>Size:</strong> ${item.size} <br/>
     <strong>Color:</strong> <span style="background-color:${
       item.color
     }"></span>  <br/>
     <strong>Quantity:</strong> ${item.quantity} <br/>
     <strong>Price:</strong> $${item.price.toFixed(2)} <br/>
   </div>
 </li>
`
    )
    .join("");

  // Read the HTML template file
  const templatePath = path.join(__dirname, "../templates/cartReminder.html");
  let htmlTemplate = fs.readFileSync(templatePath, "utf8");
  // Replace placeholders in the template
  htmlTemplate = htmlTemplate
    .replace("{{username}}", user.username)
    .replace("{{timeFrame}}", timeFrame)
    .replace("{{itemsList}}", itemsList)
    .replace("{{cartUrl}}", `${process.env.FRONT_END_URL}/shop/cart`);

  const mailOptions = {
    from: `Remider From Call it what you wanna <${process.env.FROM}>`,
    to: user.email,
    subject: `Reminder: Items in your cart for over ${timeFrame}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
