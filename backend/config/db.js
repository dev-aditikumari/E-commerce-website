const mongoose = require("mongoose");

exports.connect = async (url) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(url, { serverSelectionTimeoutMS: 20000 });
  console.log("Database connected");
};
