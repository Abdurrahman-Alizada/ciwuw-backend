import mongoose, { Model, Schema, Document, Types } from 'mongoose';

interface MessageInterface extends Document {
    email: string;
    subject: string;
    phoneNumber?: string;
    company?: string;
    content: string;
    userId?: Types.ObjectId;
}

const messageSchema = new Schema<MessageInterface>(
    {
        email: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
        },
        company: {
            type: String,
        },
        content: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Reference to the User table
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const MessageModel: Model<MessageInterface> = mongoose.model<MessageInterface>('Message', messageSchema);

export { MessageInterface, MessageModel };
export default MessageModel;
