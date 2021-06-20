import Queue, { Job } from "bull";
import dotenv from "dotenv";
import { TEZOS_API_SERVER } from "../constants";
import { client } from "../helper";
import { logger } from "../logger";
import fetch from "node-fetch";

const __baseDir = process.env.PWD;
dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

export const addTransferRequest = new Queue("addTransferRequest", {
   redis: {
      host: process.env.REDIS_HOSTNAME,
      password: process.env.REDIS_PASSWORD,
      port: 6379,
   },
});

addTransferRequest.process(async (job: Job, done) => {
   logger.info(`TRANSFER_REQUEST_JOB: job started with ${job.id}`);
   try {
      var returnValues: any = [];
      client.get("TOKEN", async (error, Token) => {
         if (error) throw new Error(`Auth Token not found please set.`);
         const args = job.data;
         const response = await fetch(
            `${TEZOS_API_SERVER}/v1/oropocket/transactions/transfer`,
            {
               method: "post",
               headers: {
                  "Content-Type": "application/json",
                  Token: String(Token),
               },
               body: JSON.stringify({
                  sender: args.sender,
                  receiver: args.receiver,
                  amount: args.amount,
                  tokenId: args.tokenId,
               }),
            }
         );

         returnValues.push(response);
      });

      return returnValues;
      logger.info(`Transfer Succeed with ${returnValues}`)
   } catch (error) {
      logger.error(`TRANSFER_REQUEST_ERROR: process failed ${job.data}`);
      throw new Error("some unexpected error");
   }
});

addTransferRequest.on("error", (error: Error) => {
   logger.error(`TRANSFER_REQUEST_QUEUE_SERVER_ERROR: ${error.message}`);
});

addTransferRequest.on("completed", (job: Job) => {
   logger.info(
      `TRANSFER_REQUEST_JOB_COMPLETED: Wow Job Successfully commited ${job.id}`
   );
});
