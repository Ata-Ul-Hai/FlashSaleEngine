import { checkoutQueue } from "../utils/queue.js";

//* when polling for the status of the job, we can use the job_id to get the status of the job from bullMQ
const checkoutStatusController = async (req, res) => {
    const { job_id } = req.params;

    try {
        const job = await checkoutQueue.getJob(job_id);

        if (!job) {
            return res.status(404).json({ message: "Order not found" });
        }

        const status = await job.getState(); // Get the current state of the job (e.g., 'completed', 'failed', 'waiting', etc.)

        return res.status(200).json({
            job_id: job.id,
            status
        });
    } catch (error) {
        console.error("🔥 Job Status Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default checkoutStatusController;