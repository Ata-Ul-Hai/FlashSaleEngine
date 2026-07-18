import { createClient } from 'redis';

const client = createClient({
    url : `redis://${process.env.REDIS_HOST || 'redis'}:6379`
});

client.on('error', err => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

export default client;