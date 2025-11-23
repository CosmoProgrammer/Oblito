import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Aborting seed.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    await client.query(`TRUNCATE TABLE cart_items, carts, shop_inventory, warehouse_inventory, shops, warehouses, products, categories, addresses, users CASCADE;`);
    const hashPassword = async (password: string) => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      return passwordHash;
    }
    
    const users = [
      { email: 'alice@example.com', password_hash: await hashPassword('hash_alice'), first_name: 'Alice', last_name: 'Anderson', role: 'customer' },
      { email: 'bob@example.com', password_hash: await hashPassword('hash_bob'), first_name: 'Bob', last_name: 'Brown', role: 'retailer' },
      { email: 'carol@example.com', password_hash: await hashPassword('hash_carol'), first_name: 'Carol', last_name: 'Clark', role: 'wholesaler' },
      { email: 'david@exacmple.com', password_hash: await hashPassword('hash_david'), first_name: 'David', last_name: 'Davis', role: 'retailer' },
      { email: 'emma@example.com', password_hash: await hashPassword('hash_emma'), first_name: 'Emma', last_name: 'Evans', role: 'retailer' },
      { email: 'frank@example.com', password_hash: await hashPassword('hash_frank'), first_name: 'Frank', last_name: 'Franklin', role: 'wholesaler' },
      { email: 'grace@example.com', password_hash: await hashPassword('hash_grace'), first_name: 'Grace', last_name: 'Green', role: 'wholesaler' },
    ];

    const userIds: string[] = [];
    for (const u of users) {
      const r = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, profile_picture_url)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [u.email, u.password_hash, u.first_name, u.last_name, u.role, null]
      );
      userIds.push(r.rows[0].id);
    }

    const categories = [
      { name: 'Electronics', description: 'Electronic items and gadgets' },
      { name: 'Clothing', description: 'Apparel and garments' },
      { name: 'Home', description: 'Home and kitchen items' },
      { name: 'Sports', description: 'Sports and outdoor equipment' },
      { name: 'Books', description: 'Books and media' },
      { name: 'Beauty', description: 'Beauty and personal care' },
      { name: 'Toys', description: 'Toys and games' },
      { name: 'Furniture', description: 'Furniture and decor' },
      { name: 'Food', description: 'Food and beverages' },
      { name: 'Automotive', description: 'Automotive accessories and parts' },
    ];
    const categoryIds: string[] = [];
    for (const c of categories) {
      await client.query(`INSERT INTO categories (name, description) VALUES ($1,$2)`, [c.name, c.description]);
    }

    // Only create shops for retailer users
    const shopIds: string[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const user = users[i]!;
      if (user.role === 'retailer') {
        const ownerId = userIds[i];
        const name = `${user.first_name}'s Shop`;
        const description = `Shop for ${user.first_name}`;
        const r = await client.query(
          `INSERT INTO shops (owner_id, name, description, address_id) VALUES ($1,$2,$3,$4) RETURNING id`,
          [ownerId, name, description, null]
        );
        shopIds.push(r.rows[0].id);
      }
    }

    // Only create warehouses for wholesaler users
    const warehouseIds: string[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const user = users[i]!;
      if (user.role === 'wholesaler') {
        const ownerId = userIds[i];
        const name = `${user.first_name}'s Warehouse`;
        const r = await client.query(
          `INSERT INTO warehouses (owner_id, name, address_id) VALUES ($1,$2,$3) RETURNING id`,
          [ownerId, name, null]
        );
        warehouseIds.push(r.rows[0].id);
      }
    }

    // Create a cart for the customer user
    for (let i = 0; i < userIds.length; i++) {
      const user = users[i]!;
      if (user.role === 'customer') {
        const customerId = userIds[i];
        await client.query(`INSERT INTO carts (customer_id) VALUES ($1)`, [customerId]);
      }
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
