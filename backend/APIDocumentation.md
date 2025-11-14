# Oblito API Documentation

This document provides a detailed overview of the Oblito API endpoints.

## Authentication API

### `POST /auth/signup`

Registers a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "userRole": "customer"
}
```

- `email` (string, required): The user's email address.
- `password` (string, required): The user's password.
- `firstName` (string, required): The user's first name.
- `lastName` (string, optional): The user's last name.
- `userRole` (string, optional): The user's role. Can be `customer`, `retailer`, or `wholesaler`. Defaults to `customer`.

**Response:**

- `201 Created`: User created successfully.
- `400 Bad Request`: Invalid input.
- `409 Conflict`: Email already in use.
- `500 Internal Server Error`: Server error.

### `POST /auth/login`

Logs in a user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- `email` (string, required): The user's email address.
- `password` (string, required): The user's password.

**Response:**

- `200 OK`: Login successful.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: Invalid email or password.
- `500 Internal Server Error`: Server error.

### `GET /auth/user`

Retrieves the currently authenticated user's information.

**Response:**

- `200 OK`: Returns the user object.
- `401 Unauthorized`: If the user is not authenticated.

### `GET /auth/google`

Redirects the user to Google for authentication.

### `GET /auth/google/callback`

Handles the callback from Google authentication.

## Cart API

### `GET /cart`

Retrieves the user's shopping cart.

**Response:**

- `200 OK`: Returns the cart object.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `POST /cart`

Adds an item to the user's shopping cart.

**Request Body:**

```json
{
  "shopInventoryId": "some-inventory-id",
  "quantity": 1
}
```

- `shopInventoryId` (string, required): The ID of the shop inventory item.
- `quantity` (number, required): The quantity of the item to add.

**Response:**

- `201 Created`: Item added to cart.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `PUT /cart/items/:id`

Updates the quantity of an item in the user's shopping cart.

**Request Body:**

```json
{
  "quantity": 2
}
```

- `quantity` (number, required): The new quantity of the item.

**Response:**

- `200 OK`: Cart updated.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: If the user is not authenticated.
- `404 Not Found`: Item not found in cart.
- `500 Internal Server Error`: Server error.

### `DELETE /cart/items/:id`

Removes an item from the user's shopping cart.

**Response:**

- `200 OK`: Item removed from cart.
- `401 Unauthorized`: If the user is not authenticated.
- `404 Not Found`: Item not found in cart.
- `500 Internal Server Error`: Server error.

## Category API

### `GET /categories`

Retrieves all product categories.

**Response:**

- `200 OK`: Returns an array of category objects.
- `500 Internal Server Error`: Server error.

## Inventory API

### `GET /inventory`

Retrieves the inventory for the authenticated retailer or wholesaler.

**Query Parameters:**

- `page` (number, optional, default: 1): The page number for pagination.
- `limit` (number, optional, default: 10): The number of items per page.
- `sort` (string, optional, default: 'createdAt_desc'): The sort order. Can be `createdAt_asc`, `createdAt_desc`, `price_asc`, `price_desc`, `name_asc`, `name_desc`.
- `minPrice` (number, optional): The minimum price of the products.
- `maxPrice` (number, optional): The maximum price of the products.
- `categories` (string[], optional): An array of category names to filter by.

**Response:**

- `200 OK`: Returns the inventory and pagination information.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `POST /inventory/listings`

Creates a new retail listing from a wholesale product. (Retailer only)

**Request Body:**

```json
{
  "warehouseInventoryId": "some-warehouse-inventory-id",
  "price": 19.99,
  "isProxyItem": false,
  "stockQuantity": 10
}
```

- `warehouseInventoryId` (string, required): The ID of the warehouse inventory item.
- `price` (number, required): The retail price of the item.
- `isProxyItem` (boolean, required): Whether the item is a proxy item.
- `stockQuantity` (number, required): The stock quantity for the retail listing.

**Response:**

- `201 Created`: The new listing object.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

## Product API

### `GET /products/upload-url`

Generates a presigned URL for uploading a product image to S3.

**Query Parameters:**

- `fileName` (string, required): The name of the file to upload.
- `fileType` (string, required): The MIME type of the file to upload.

**Response:**

- `200 OK`: Returns the `uploadUrl` and `finalUrl`.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `GET /products`

Retrieves all products.

**Query Parameters:**

- `page` (number, optional, default: 1): The page number for pagination.
- `limit` (number, optional, default: 10): The number of items per page.
- `sort` (string, optional, default: 'createdAt_desc'): The sort order. Can be `createdAt_asc`, `createdAt_desc`, `price_asc`, `price_desc`, `name_asc`, `name_desc`.
- `minPrice` (number, optional): The minimum price of the products.
- `maxPrice` (number, optional): The maximum price of the products.
- `categories` (string[], optional): An array of category names to filter by.

**Response:**

- `200 OK`: Returns the products and pagination information.
- `500 Internal Server Error`: Server error.

### `GET /products/:id`

Retrieves a single product by its ID.

**Response:**

- `200 OK`: Returns the product object.
- `404 Not Found`: Product not found.
- `500 Internal Server Error`: Server error.

### `POST /products`

Creates a new product.

**Request Body:**

```json
{
  "name": "New Product",
  "description": "A description of the new product.",
  "price": 29.99,
  "categoryId": "some-category-id",
  "stockQuantity": 100,
  "imageUrls": ["https://example.com/image.jpg"]
}
```

- `name` (string, required): The name of the product.
- `description` (string, required): The description of the product.
- `price` (number, required): The price of the product.
- `categoryId` (string, required): The ID of the product's category.
- `stockQuantity` (number, required): The stock quantity of the product.
- `imageUrls` (string[], required): An array of image URLs for the product.

**Response:**

- `201 Created`: The new product object.
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `GET /warehouse-products`

Retrieves all wholesale products.

**Query Parameters:**

- `page` (number, optional, default: 1): The page number for pagination.
- `limit` (number, optional, default: 10): The number of items per page.
- `sort` (string, optional, default: 'createdAt_desc'): The sort order. Can be `createdAt_asc`, `createdAt_desc`, `price_asc`, `price_desc`, `name_asc`, `name_desc`.
- `minPrice` (number, optional): The minimum price of the products.
- `maxPrice` (number, optional): The maximum price of the products.
- `categories` (string[], optional): An array of category names to filter by.

**Response:**

- `200 OK`: Returns the wholesale products and pagination information.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.

### `GET /warehouse-products/:id`

Retrieves a single wholesale product by its ID.

**Response:**

- `200 OK`: Returns the wholesale product object.
- `404 Not Found`: Product not found.
- `401 Unauthorized`: If the user is not authenticated.
- `500 Internal Server Error`: Server error.
