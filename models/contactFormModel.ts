import mongoose, { Schema, Document } from 'mongoose';

interface ContactFormInterface extends Document {
  name: string;
  subject: string;
  email: string;
  message: string;
  phoneNumber: string;
  company: string;
}

const contactFormSchema = new Schema<ContactFormInterface>({
  name: { type: String },
  email: { type: String, required: true },
  subject: { type: String },
  phoneNumber: { type: String, required: true },
  company: { type: String, required: true },
  message: { type: String, required: true },
});

const ContactFormModel = mongoose.model<ContactFormInterface>('ContactForm', contactFormSchema);

export { ContactFormInterface, ContactFormModel };
