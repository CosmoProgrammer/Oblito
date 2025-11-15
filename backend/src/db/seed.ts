import { Pool } from 'pg';
import dotenv from 'dotenv';

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

    const users = [
      { email: 'alice@example.com', password_hash: 'hash_alice', first_name: 'Alice', last_name: 'Anderson', role: 'customer' },
      { email: 'bob@example.com', password_hash: 'hash_bob', first_name: 'Bob', last_name: 'Brown', role: 'retailer' },
      { email: 'carol@example.com', password_hash: 'hash_carol', first_name: 'Carol', last_name: 'Clark', role: 'wholesaler' },
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

    const addressIds: string[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const uid = userIds[i];
      const street = `${100 + i} Main St`;
      const city = 'Metropolis';
      const state = 'State';
      const postal = `1000${i}`;
      const country = 'Country';
      const lon = -73.9 + i * 0.01;
      const lat = 40.7 + i * 0.01;
      const r = await client.query(
        `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, location, is_primary)
         VALUES ($1,$2,$3,$4,$5,$6, POINT($7,$8), $9) RETURNING id`,
        [uid, street, city, state, postal, country, lon, lat, true]
      );
      addressIds.push(r.rows[0].id);
    }

    const categories = [
      { name: 'Electronics', description: 'Electronic items' },
      { name: 'Clothing', description: 'Apparel and garments' },
      { name: 'Home', description: 'Home and kitchen' },
      { name: 'Sports', description: 'Sports and outdoor equipment' },
      { name: 'Books', description: 'Books and media' },
    ];
    const categoryIds: string[] = [];
    for (const c of categories) {
      const r = await client.query(`INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING id`, [c.name, c.description]);
      categoryIds.push(r.rows[0].id);
    }

    const productIds: string[] = [];
    const productPrices: number[] = [];
    for (let i = 1; i <= 15; i++) {
      const name = `Product ${i}`;
      const description = `Description for product ${i}`;
      const price = parseFloat((9.99 + i * 2).toFixed(2));
      const categoryId = categoryIds[i % categoryIds.length];
      const imageURLs = `{"https://placehold.co/600x400?text=Product+${i}", "https://placehold.co/600x400?text=Product+${i}+Alt2"}`;
      const creatorId = userIds[(i - 1) % userIds.length];
      const r = await client.query(
        `INSERT INTO products (name, description, category_id, image_urls, creator_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [name, description, categoryId, imageURLs, creatorId]
      );
      productIds.push(r.rows[0].id);
      productPrices.push(price);
    }

    const shopIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const ownerId = userIds[i];
      const addressId = addressIds[i];
  const name = `${users[i]!.first_name}'s Shop`;
  const description = `Shop for ${users[i]!.first_name}`;
      const r = await client.query(
        `INSERT INTO shops (owner_id, name, description, address_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [ownerId, name, description, addressId]
      );
      shopIds.push(r.rows[0].id);
    }

    const warehouseIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const ownerId = userIds[i];
      const addressId = addressIds[i];
  const name = `${users[i]!.first_name}'s Warehouse`;
      const r = await client.query(
        `INSERT INTO warehouses (owner_id, name, address_id) VALUES ($1,$2,$3) RETURNING id`,
        [ownerId, name, addressId]
      );
      warehouseIds.push(r.rows[0].id);
    }

    const warehouseInventoryIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const warehouseId = warehouseIds[i % warehouseIds.length];
      const productId = productIds[i];
      const qty = 100 + i * 10;
      const price = productPrices[i];
      const r = await client.query(
        `INSERT INTO warehouse_inventory (warehouse_id, product_id, stock_quantity, price) VALUES ($1,$2,$3,$4) RETURNING id`,
        [warehouseId, productId, qty, price]
      );
      warehouseInventoryIds.push(r.rows[0].id);
    }

    const shopInventoryIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const shopId = shopIds[i % shopIds.length];
      const productId = productIds[i];
      const qty = 10 + i * 5;
      const price = productPrices[i];
      const r = await client.query(
        `INSERT INTO shop_inventory (shop_id, product_id, stock_quantity, is_proxy_item, warehouse_inventory_id, price)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [shopId, productId, qty, false, warehouseInventoryIds[i], price]
      );
      shopInventoryIds.push(r.rows[0].id);
    }

    // Create carts for users and add a couple of cart items per cart
    const cartIds: string[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const customerId = userIds[i];
      const r = await client.query(`INSERT INTO carts (customer_id) VALUES ($1) RETURNING id`, [customerId]);
      cartIds.push(r.rows[0].id);
    }

    // Add 1-2 items per cart, cycling available shop inventory rows
    for (let i = 0; i < cartIds.length; i++) {
      const cartId = cartIds[i];
      // add first item
      const si1 = shopInventoryIds[i % shopInventoryIds.length];
      await client.query(`INSERT INTO cart_items (cart_id, shop_inventory_id, quantity) VALUES ($1,$2,$3)`, [cartId, si1, 1]);
      // add a second item
      if (shopInventoryIds.length > 1) {
        const si2 = shopInventoryIds[(i + 1) % shopInventoryIds.length];
        await client.query(`INSERT INTO cart_items (cart_id, shop_inventory_id, quantity) VALUES ($1,$2,$3)`, [cartId, si2, 2]);
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
