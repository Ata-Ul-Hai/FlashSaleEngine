import 'dotenv/config';
import express from 'express';

import client from './src/config/redisClient.js';
import flashSaleRoutes from './src/routes/flashSaleRoutes.js';

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(express.json());
app.use('/api', flashSaleRoutes);

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