# API Documentation

This document provides a comprehensive overview of all the API routes available in the backend.

## Authentication

### POST /signup

-   **Description**: Registers a new user.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    }
    ```
-   **Response**:
    -   **201**:
        ```json
        {
          "message": "User created successfully"
        }
        ```
    -   **400**: Bad request (e.g., validation error)
    -   **409**: User with this email already exists

### POST /login

-   **Description**: Logs in a user.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
-   **Response**:
    -   **200**:
        ```json
        {
          "message": "Logged in successfully"
        }
        ```
        (Sets a `jwt` cookie)
    -   **400**: Bad request (e.g., validation error)
    -   **401**: Invalid credentials

### GET /user

-   **Description**: Retrieves the currently authenticated user's data.
-   **Authentication**: Required (JWT)
-   **Response**:
    -   **200**:
        ```json
        {
          "id": "...",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "customer",
          "profilePictureUrl": null
        }
        ```
    -   **401**: Unauthorized

## Products

### GET /products

-   **Description**: Retrieves a list of all products available for sale.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): The page number for pagination.
    -   `limit` (number, optional, default: 10): The number of items per page.
    -   `minPrice` (number, optional): The minimum price of products to fetch.
    -   `maxPrice` (number, optional): The maximum price of products to fetch.
    -   `sort` (string, optional, default: 'createdAt_desc'): The sort order. Can be `price_asc`, `price_desc`, `name_asc`, `name_desc`, `createdAt_asc`, `createdAt_desc`.
    -   `categories` (string, optional): A comma-separated list of category names to filter by.
-   **Response**:
    -   **200**:
        ```json
        {
          "products": [
            {
              "id": "...",
              "name": "Product Name",
              "description": "Product Description",
              "price": "100.00",
              "categoryId": "...",
              "imageURLs": ["url1", "url2"],
              "creatorId": "...",
              "createdAt": "...",
              "stockQuantity": "10"
            }
          ],
          "pagination": {
            "totalCount": 1,
            "totalPages": 1,
            "currentPage": 1,
            "limit": 10
          }
        }
        ```

### GET /products/:id

-   **Description**: Retrieves a single product by its ID.
-   **Response**:
    -   **200**:
        ```json
        {
          "product": {
            "id": "...",
            "name": "Product Name",
            "description": "Product Description",
            "categoryId": "...",
            "imageURLs": ["url1", "url2"],
            "price": "100.00",
            "stockQuantity": "10",
            "shopId": "...",
            "shopName": "Shop Name",
            "createdAt": "..."
          }
        }
        ```
    -   **404**: Product not found

### POST /products

-   **Description**: Creates a new product.
-   **Authentication**: Required (JWT, role: 'wholesaler' or 'retailer')
-   **Request Body**:
    ```json
    {
      "name": "New Product",
      "description": "A great new product",
      "price": 150.00,
      "categoryId": "...",
      "stockQuantity": 20,
      "imageUrls": ["url1", "url2"]
    }
    ```
-   **Response**:
    -   **201**:
        ```json
        {
          "id": "...",
          "name": "New Product",
          "description": "A great new product",
          "categoryId": "...",
          "imageURLs": ["url1", "url2"],
          "creatorId": "..."
        }
        ```
    -   **400**: Bad request (e.g., validation error)

### GET /products/upload-url

-   **Description**: Generates a presigned S3 URL for uploading a product image.
-   **Authentication**: Required (JWT, role: 'wholesaler' or 'retailer')
-   **Query Parameters**:
    -   `fileName` (string, required): The name of the file to be uploaded.
    -   `fileType` (string, required): The MIME type of the file (e.g., 'image/jpeg').
-   **Response**:
    -   **200**:
        ```json
        {
          "uploadUrl": "...",
          "finalUrl": "..."
        }
        ```

### GET /warehouse-products

-   **Description**: Retrieves a list of all products in the warehouse.
-   **Authentication**: Required (JWT, role: 'retailer')
-   **Query Parameters**: Same as `/products`.
-   **Response**: Same as `/products`.

### GET /warehouse-products/:id

-   **Description**: Retrieves a single warehouse product by its ID.
-   **Authentication**: Required (JWT, role: 'retailer')
-   **Response**:
    -   **200**:
        ```json
        {
          "product": {
            "id": "...",
            "name": "Product Name",
            "description": "Product Description",
            "price": "100.00",
            "categoryId": "...",
            "imageURLs": ["url1", "url2"],
            "creatorId": "...",
            "createdAt": "...",
            "stockQuantity": "10",
            "warehouseId": "...",
            "warehouseName": "Warehouse Name"
          }
        }
        ```
    -   **404**: Product not found

## Categories

### GET /categories

-   **Description**: Retrieves a list of all product categories.
-   **Response**:
    -   **200**:
        ```json
        [
          {
            "id": "...",
            "name": "Category Name"
          }
        ]
        ```

## Cart

### GET /cart

-   **Description**: Retrieves the current user's shopping cart.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Response**:
    -   **200**:
        ```json
        {
          "id": "...",
          "customerId": "...",
          "cartItems": [
            {
              "id": "...",
              "cartId": "...",
              "shopInventoryId": "...",
              "quantity": 1,
              "shopInventory": { ... }
            }
          ]
        }
        ```

### POST /cart

-   **Description**: Adds an item to the cart.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Request Body**:
    ```json
    {
      "shopInventoryId": "...",
      "quantity": 1
    }
    ```
-   **Response**:
    -   **201**:
        ```json
        {
          "message": "Item added to cart"
        }
        ```
    -   **400**: Bad request (e.g., validation error)

### PUT /cart/items/:id

-   **Description**: Updates the quantity of an item in the cart.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Request Body**:
    ```json
    {
      "quantity": 2
    }
    ```
-   **Response**:
    -   **200**:
        ```json
        {
          "message": "Cart item updated"
        }
        ```
    -   **400**: Bad request (e.g., validation error)
    -   **404**: Cart item not found

### DELETE /cart/items/:id

-   **Description**: Removes an item from the cart.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Response**:
    -   **200**:
        ```json
        {
          "message": "Item removed from cart"
        }
        ```
    -   **404**: Cart item not found

## Orders

### GET /orders

-   **Description**: Retrieves a list of the current user's orders.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Response**:
    -   **200**:
        ```json
        {
          "orders": [
            {
              "id": "...",
              "customerId": "...",
              "orderType": "retail",
              "shopId": "...",
              "status": "pending",
              "totalAmount": "100.00",
              "paymentMethod": "credit_card",
              "deliveryAddressId": "...",
              "createdAt": "...",
              "shop": { "name": "Shop Name" },
              "orderItems": [
                {
                  "id": "...",
                  "orderId": "...",
                  "shopInventoryId": "...",
                  "quantity": 1,
                  "priceAtPurchase": "100.00",
                  "status": "pending",
                  "shopInventory": { ... }
                }
              ]
            }
          ]
        }
        ```

### POST /orders

-   **Description**: Creates a new order from the user's cart.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Request Body**:
    ```json
    {
      "deliveryAddressId": "...",
      "paymentMethod": "credit_card"
    }
    ```
-   **Response**:
    -   **201**:
        ```json
        {
          "message": "Order placed successfully",
          "generatedOrders": 1,
          "orderIds": ["..."]
        }
        ```
    -   **400**: Bad request (e.g., cart is empty, invalid address)

### DELETE /orders/:id

-   **Description**: Cancels an order.
-   **Authentication**: Required (JWT, role: 'customer')
-   **Response**:
    -   **200**:
        ```json
        {
          "message": "Order cancelled successfully"
        }
        ```
    -   **400**: Cannot cancel order with status 'delivered' or 'cancelled'
    -   **404**: Order not found

## Wholesale Orders

### POST /wholesale-orders

-   **Description**: Creates a new wholesale order.
-   **Authentication**: Required (JWT, role: 'retailer' or 'wholesaler')
-   **Request Body**:
    ```json
    {
      "warehouseId": "...",
      "productId": "...",
      "quantity": 10,
      "deliveryAddressId": "...",
      "paymentMethod": "bank_transfer"
    }
    ```
-   **Response**:
    -   **201**:
        ```json
        {
          "message": "Wholesale order placed successfully",
          "orderId": "..."
        }
        ```
    -   **400**: Bad request (e.g., validation error, insufficient stock)

### GET /wholesale-orders

-   **Description**: Retrieves a list of wholesale orders.
-   **Authentication**: Required (JWT, role: 'retailer' or 'wholesaler')
-   **Response**:
    -   **200**:
        ```json
        {
          "orders": [
            {
              "id": "...",
              "retailerId": "...",
              "warehouseId": "...",
              "productId": "...",
              "quantity": 10,
              "totalAmount": "...",
              "status": "pending",
              "createdAt": "..."
            }
          ]
        }
        ```

### DELETE /wholesale-orders/:id

-   **Description**: Cancels a wholesale order.
-   **Authentication**: Required (JWT, role: 'retailer' or 'wholesaler')
-   **Response**:
    -   **200**:
        ```json
        {
          "message": "Wholesale order cancelled successfully"
        }
        ```
    -   **400**: Cannot cancel order with status 'delivered' or 'cancelled'
    -   **404**: Order not found

## Inventory

### GET /inventory

-   **Description**: Retrieves the inventory for a retailer or wholesaler.
-   **Authentication**: Required (JWT, role: 'retailer' or 'wholesaler')
-   **Query Parameters**: Same as `/products`.
-   **Response**: Same as `/products`.