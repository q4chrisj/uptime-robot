import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import { DatabaseService } from "./services/DatabaseService";
import { MonitoringService } from "./services/MonitoringService";
import { Logger } from "./utils/Logger";
import { setupRoutes } from "./api/routes";

// Load environment variables
dotenv.config();

// Create logger
const logger = new Logger();

// Set up Express app
const app = express();
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 3000;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_TABLE_PREFIX =
  process.env.DYNAMODB_TABLE_PREFIX || "uptime_robot_";
const CHECK_INTERVAL_MINUTES = parseInt(
  process.env.CHECK_INTERVAL_MINUTES || "5",
  10,
);
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "5000", 10);

// Initialize services
const databaseService = new DatabaseService(
  AWS_REGION,
  DYNAMODB_TABLE_PREFIX,
  logger
);

const monitoringService = new MonitoringService(
  databaseService,
  logger,
  TIMEOUT_MS,
);

// Set up API routes
setupRoutes(app, databaseService, monitoringService, logger);

// Schedule periodic checks
// const cronSchedule = `*/${CHECK_INTERVAL_MINUTES} * * * *`; // Every X minutes
// cron.schedule(cronSchedule, async () => {
//   logger.info(`Running scheduled check at ${new Date().toISOString()}`);
//   try {
//     await monitoringService.checkAllSites();
//   } catch (error) {
//     logger.error('Error in scheduled check:', error);
//   }
// });
//
// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "An unexpected error occurred" });
  },
);

// Start the server
app.listen(PORT, () => {
  logger.info(`Uptime Robot service running on port ${PORT}`);
  logger.info(`Check interval set to ${CHECK_INTERVAL_MINUTES} minutes`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
