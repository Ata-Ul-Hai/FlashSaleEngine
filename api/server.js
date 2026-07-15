import 'dotenv/config';
import express from 'express';
import client from './src/config/redis.config.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Test Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API Node is running' });
});

// * Bootstraping function -> to connect to redis before accepting the HTTP traffic
const startServer = async () => {
    try {
        await client.connect();

        app.listen(PORT, () => {
            console.log(`🚀 API Node is running and listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('🔥 Critical Failure! Failed to start server:', error);
    }
}

startServer();

// post req through traefik

    // check and update redis cache
    // update postgres
    // bullMQ
        // return to user frontend for in process status
    // worker picks up the job from bullMQ and processes it