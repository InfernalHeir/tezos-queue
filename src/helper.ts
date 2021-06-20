import fetch from "node-fetch";
import { TEZOS_API_SERVER } from "./constants";
import redis from "redis";
import dotenv from "dotenv";

const __baseDir = process.env.PWD;
dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

export const client = redis.createClient({
   host: process.env.REDIS_HOSTNAME,
   password: process.env.REDIS_PASSWORD,
   port: 6379,
});

export const configToken = async () => {
   const data = await fetch(`${TEZOS_API_SERVER}/v1/oropocket/health-check`);
   const results = await data.json();
   const token = results?.data?.token;
   await client.set("TOKEN", token);
};
