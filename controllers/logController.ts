// controllers/logController.ts
import { Request, Response } from 'express';
import LogModel, { LogInterface } from '../models/logModel';

// Create a log entry
const createLog = async (req: Request, res: Response): Promise<void> => {
	try {
		const { level, message, userName, userRole, action, logType } = req.body;

		const newLog: LogInterface = new LogModel({
			level,
			message,
			userName,
			userRole,
			action,
			logType,
		});

		const savedLog = await newLog.save();
		res.status(201).json({
			success: true,
			message: 'Log entry created successfully',
			log: savedLog,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

// Get all log entries with optional filtering
const getAllLogs = async (req: Request, res: Response): Promise<void> => {
	try {
		const page: number = parseInt(req.query.page as string) || 1;
		const pageSize: number = parseInt(req.query.pageSize as string) || 10;
		const offset: number = (page - 1) * pageSize;

		const { startDate, endDate, searchQuery, status } = req.query;

		const filter: any = {};
		if (startDate && endDate) {
			filter.dateTime = {
				$gte: new Date(startDate as string),
				$lte: new Date(endDate as string),
			};
		}
		if (searchQuery) {
			filter.userName = { $regex: searchQuery, $options: 'i' };
		}
		if (status) {
			filter.logType = { $regex: status, $options: 'i' };
		}

		// Get total count of logs
		const totalElements = await LogModel.find(filter).countDocuments();
		const totalPages = Math.ceil(totalElements / pageSize);

		// Get logs with pagination
		const logs: LogInterface[] = await LogModel.find(filter)
			.skip(offset)
			.limit(pageSize)
			.sort({ dateTime: -1 });

		const pagination = {
			totalElements,
			pageNumber: page,
			pageSize,
			totalPages,
		};

		res.status(200).json({
			success: true,
			data: logs,
			page: pagination,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export { createLog, getAllLogs };
