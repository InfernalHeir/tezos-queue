import express, { Application, Request, Response } from "express";
import { json, urlencoded } from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import { addTransferRequest } from "./queues";
import { logger } from "./logger";
import _ from "lodash";
import cors from "cors";
import { tokenRequestQueue } from "./queues/tokenQueue";
import { configToken } from "./helper";
import { transferRouteValidation } from "./validation";
import { validationResult } from "express-validator";

const __baseDir = process.env.PWD;
dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

const PORT = Number(process.env.PORT);
const HOSTNAME = String(process.env.REDIS_HOSTNAME);

const app: Application = express();

// set the parser middleware
app.use(json({ limit: "50kb", strict: true }));
// set the url encoded
app.use(urlencoded({ extended: true }));
// set the morgon logger
app.use(morgan("combined"));

app.use(cors());

app.post(
   "/transfer-request",
   transferRouteValidation,
   async (req: Request, res: Response) => {
      try {
         const errors = validationResult(req);

         if (!errors.isEmpty()) {
            return res.json({
               code: 200,
               message: errors,
            });
         }
         const args = req.body;

         const job = await addTransferRequest.add(args, {
            max: 1000,
            delay: 120000, // in 2 minutes
            attempts: 1,
            backoff: 5,
            priority: args.priority,
         });

         logger.info(
            `JOB:: Job Added Successfully with ${job.id} and Priority ${args.priority}`
         );

         return res.status(200).json({
            code: 200,
            jobId: job.id,
            priority: args.priority,
            message: `Transfer Request added by the Priority of ${args.priority}`,
         });
      } catch (err) {
         logger.error(`ROUTE:: ${err.message}`);
         return res.status(500).json({
            code: 500,
            message: err.message,
         });
      }
   }
);

app.get("/jobstatus", async (req: Request, res: Response) => {
   const jobId = req.query.jobId;
   const jobDetails = await addTransferRequest.getJob(Number(jobId));
   res.status(200).json({
      code: 200,
      data: {
         timeStamp: jobDetails?.timestamp,
         finishTime: jobDetails?.finishedOn,
         processTime: jobDetails?.processedOn,
         jobData: jobDetails?.data,
         returnValues: jobDetails?.returnvalue,
      },
   });
});

app.post("/setToken", async (req: Request, res: Response) => {
   try {
      await configToken();
      return res.json({
         code: 200,
         data: "Token configuration done",
      });
   } catch (error) {
      logger.error(`FAILED: please try again`);
      throw new Error("some unexpected error");
   }
});
// if no route found
app.use(function (req, res, next) {
   logger.error(`BAD_REQUEST: one bad request found from ${req.ip}`);
   res.status(400).json({
      code: 400,
      message: "BAD_REQUEST:: no route found.",
   });
});

app.listen(PORT, HOSTNAME, async () => {
   try {
      await tokenRequestQueue.add(
         {},
         { repeat: { cron: "0 0 12 * * ?" }, attempts: 2, backoff: 5 }
      );
      logger.info(`Repeatable Job Added`);
   } catch (err) {
      logger.error(
         `Token is not updated please try to set manually. reason ${err.message}.`
      );
   }
   logger.info(`Queue server running at ${PORT}`);
});
