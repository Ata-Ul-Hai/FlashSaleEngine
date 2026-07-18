import { addToCheckoutQueue } from '../utils/queue.js';
import redisClient from '../config/redisClient.js';

const checkoutController = async (req, res) => {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({ message: "Missing user_id or product_id" });
    }

    const stockKey = `stock:product:${product_id}`;
    const userKey = `user:product:${product_id}`;
    const jobData = { user_id, product_id };

    try {
        // * Anti Spam Guard (Atomic Set Add)
        const added = await redisClient.sAdd(userKey, user_id);

        if (added === 0) {
            return res.status(429).json({ message: 'You have already requested this item.' })
        }

        //* Redis Atomic Decrement (The Guard Check)
        const stock = await redisClient.decrBy(stockKey, 1);

        if (stock < 0) {
            await redisClient.sRem(userKey, user_id); // So that the user can try in future when stock is available again
            return res.status(409).json({message: 'Item is out of stock' });
        }

        const job = await addToCheckoutQueue(jobData);

        return res.status(202).json({
            message: "processing",
            job_id: job.id
        });
    } catch (error) {
        console.error("🔥 Checkout Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default checkoutController;