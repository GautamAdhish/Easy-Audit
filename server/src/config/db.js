import mongoose from "mongoose";

/**
 * Opens the Mongoose connection to MongoDB.
 * Fails fast (exits the process) if the connection cannot be established,
 * since the API is useless without a database.
 */
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`,
    );

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    return conn;
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
