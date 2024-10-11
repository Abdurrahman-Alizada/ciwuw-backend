import { Request, Response } from "express";
import { ContactFormModel } from "../models/contactFormModel";

const submitContactForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, message, subject, phoneNumber, company } = req.body;

    if (!email || !subject || !phoneNumber || !company || !message) {
      res.status(400).json({ message: "Please enter required fields." });
      return;
    }

    const contactFormEntry = new ContactFormModel({
      name,
      email,
      message,
      subject,
      phoneNumber,
      company,
    });
    await contactFormEntry.save();

    res.status(201).json({ message: "Contact form submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { submitContactForm };
