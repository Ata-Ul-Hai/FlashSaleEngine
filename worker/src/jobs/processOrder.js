import pool from '../database.js';

export async function processOrder(job) {
    const {user_id, product_id} = job.data;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

    // ! Caused Optimistic Lock Starvation
        /* 
        const res = await client.query('SELECT stock, version FROM products where id = $1', [product_id]);

        if(res.rows.length === 0) {
                // console.log("product_id:", product_id);
                // console.log(res.rows);
            throw new Error('Product not found in Database');
        }

        const {stock, version} = res.rows[0];

        if(stock <= 0) {
            await client.query('ROLLBACK');
            throw new Error('Product not found in Database');
        } */

    //? Replaced Optimistic Locking with Native Atomic Update. 
    //? Postgres internally handles the row-level lock. No more collision retry storms!
        const updateRes = await client.query(
            'UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0',
            [product_id]
        );

        if (updateRes.rowCount === 0) {
            await client.query('ROLLBACK');
            throw new Error('Optimistic locking collision detected! Retrying...')
        }

        const orderRes = await client.query(
            "INSERT INTO orders (user_id, product_id, status) VALUES ($1, $2, 'COMPLETED') RETURNING id", 
            [user_id, product_id]
        );

        await client.query('COMMIT');
        return { success: true, user_id, product_id, order_id: orderRes.rows[0].id };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

