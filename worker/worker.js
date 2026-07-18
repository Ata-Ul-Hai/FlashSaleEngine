import { Worker } from "bullmq";
import { checkoutQueue } from "../api/src/utils/queue.js";
import { processOrder } from "./src/jobs/processOrder.js";
import 'dotenv/config';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379
};

const worker = new Worker(checkoutQueue.name, async (job) => {
    console.log(`[Job ${job.id}] Processing order for User: ${job.data.user_id}`);

    return processOrder(job);
}, { 
    connection, 
    concurrency: 5 
});

worker.on('completed', (job) => {
    console.log(`✅ [Job ${job.id}] Successfully secured item for User: ${job.data.user_id}`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ [Job ${job.id}] Failed with error: ${err.message}`);
});