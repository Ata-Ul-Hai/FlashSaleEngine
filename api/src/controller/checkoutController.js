import { addToCheckoutQueue } from '../utils/queue.js';
import client from '../config/redis.config.js';

const checkoutController = async (req, res) => {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({ message: "Missing user_id or product_id" });
    }

    const itemKey = `stock:product:${product_id}`;
    const jobData = { user_id, product_id };

    try {
        //* Redis atomic decrement (The Guard Check)
        const stock = await client.decrBy(itemKey);
        if (stock < 0) {
            return res.status(409).json({message: 'Item is out of stock' });
        }

        const job = await addToCheckoutQueue(jobData);

        return res.status(202).json({
            job_id: job.id,
            status: "processing"
        });
    } catch (error) {
        console.error("🔥 Checkout Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default checkoutController;