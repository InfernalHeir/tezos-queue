import Queue, { Job } from "bull";
import { logger } from "../logger";
import { configToken } from "../helper";
import dotenv from "dotenv";

const __baseDir = process.env.PWD;
dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

export const tokenRequestQueue = new Queue("tokenRequestQueue", {
   redis: {
      host: process.env.REDIS_HOSTNAME,
      password: process.env.REDIS_PASSWORD,
      port: 6379,
   },
});

tokenRequestQueue.process(async (job: Job, done) => {
   logger.info(`TOKEN_REQUEST_JOB: job started with ${job.id}.`);
   try {
      await configToken();
      logger.info(`TOKEN_REQUEST_JOB: Token Updated.`);
   } catch (error) {
      logger.error(
         `TOKEN_REQUEST_ERORR: please try to set manually for now. reason: ${error.message}`
      );
   }
});

tokenRequestQueue.on("error", (error: Error) => {
   logger.error(`TOKEN_REQUEST_QUEUE_SERVER_ERROR: ${error.message}`);
});

tokenRequestQueue.on("completed", (job: Job) => {
   logger.info(
      `TOKEN_REQUEST_JOB_COMPLETED: Boom Job successfully commited ${job.id}`
   );
});
