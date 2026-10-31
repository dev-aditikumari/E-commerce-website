require("dotenv").config();
const { createApp } = require("./app");
const { connect } = require("./config/db");

const PORT = process.env.PORT || 4000;

const start = async () => {
  const missing = ["MONGODB_URL", "JWT_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  await connect(process.env.MONGODB_URL);
  const server = createApp().listen(PORT, () => console.log(`API running on port ${PORT}`));

  const stop = () => {
    server.close(() => require("mongoose").connection.close().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
};

if (require.main === module) start();
module.exports = { start };
