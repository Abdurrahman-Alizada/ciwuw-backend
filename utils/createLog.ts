import LogModel from "../models/logModel";

interface LogData {
  dateTime: Date;
  userName: string;
  userRole: string;
  action: string;
  logType: "Info" | "Error";
}

const createLog = async (logData: any): Promise<void> => {
  try {
    const newLog = new LogModel(logData);
    await newLog.save();
  } catch (error) {
    console.error("Error saving log:", error);
  }
};

export default createLog;
