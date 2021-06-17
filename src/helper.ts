import fetch from "node-fetch";
import { TEZOS_API_SERVER } from "./constants";
import redis from "redis";

export const client = redis.createClient({
   host: process.env.REDIS_HOSTNAME,
   port: 6379,
});

export const configToken = async () => {
   const data = await fetch(`${TEZOS_API_SERVER}/v1/oropocket/health-check`);
   const results = await data.json();
   const token = results?.token;
   await client.set("TOKEN", token);
};
