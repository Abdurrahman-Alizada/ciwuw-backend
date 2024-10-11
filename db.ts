import mongoose from "mongoose";
require("dotenv").config();
const connectDb = async () => {
  try {
    await mongoose.connect(
      `${process.env.DB_LINK}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as Parameters<typeof mongoose.connect>[1]
    );
    console.log("MongoDb is connected");
  } catch (error: any) {
    console.log(error.message);
  }
};

export default connectDb;
