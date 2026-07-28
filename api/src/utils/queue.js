import { Queue } from 'bullmq';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379
};

export const checkoutQueue = new Queue('checkout-queue', {
    connection
});

export const addToCheckoutQueue = async (jobData) => {
    const job = await checkoutQueue.add('checkout-job', jobData, {
        removeOnComplete: { age: 3600, count: 5000 },
        removeOnFail: { age: 24 * 3600 }, //* kept in the list if failed to debug later!
        attempts: 3, // Number of retry attempts
        backoff: {
            type: 'exponential',
            delay: 1000 // Delay in milliseconds before retrying
        }
    });
    return job; // Return the job data for reference
};