import mongoose, { Schema, Document } from 'mongoose';

export interface LogInterface extends Document {
	dateTime: Date;
	userName: string;
	userRole: string;
	action: string;
	logType: 'Info' | 'Error';
}

const LogSchema: Schema = new Schema({
	dateTime: { type: Date, required: true },
	userName: { type: String,  },
	userRole: { type: String,  },
	action: { type: String, required: true },
	logType: { type: String, enum: ['Info', 'Error'], required: true },
	whom: {
		username: { type: String },
		email: { type: String },
		role: { type: String },
	},
});

const LogModel = mongoose.model<LogInterface>('Log', LogSchema);

export default LogModel;
