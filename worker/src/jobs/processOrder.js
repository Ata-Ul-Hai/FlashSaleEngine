import pool from '../database.js';

export async function processOrder(job) {
    const {user_id, product_id} = job.data;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const res = await client.query('SELECT stock, version FROM products where id = $1', [product_id]);

        if(res.rows.length === 0) {
            console.log("product_id:", product_id);
            console.log(res.rows);
            throw new Error('Product not found in Database');
        }

        const {stock, version} = res.rows[0];

        if(stock <= 0) {
            throw new Error('Product not found in Database');
        }

        const updateRes = await client.query(
            'UPDATE products SET stock = stock - 1, version = version + 1 WHERE id = $1 AND version = $2 AND stock > 0',
            [product_id, version]
        );

        if (updateRes.rowCount === 0) {
            await client.query('ROLLBACK');
            throw new Error('Optimistic locking collision detected! Retrying...')
        }

        await client.query('INSERT INTO orders (user_id, product_id) VALUES ($1, $2)', [user_id, product_id]);

        await client.query('COMMIT');
        return { success: true, user_id, product_id };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.release();
    }
}

