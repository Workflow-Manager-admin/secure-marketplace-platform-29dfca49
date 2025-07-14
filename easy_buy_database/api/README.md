# Easy Buy Backend API – Full Reference

This document describes in detail all REST endpoints for the Secure Marketplace Platform backend (Node.js/Express). It outlines request/response schemas, authentication requirements, business logic, error handling, and example payloads.  
It acts as both API contract and integration guide.

---

## **Authentication**

All endpoints marked with `🔒` require a JWT Bearer token in the `Authorization:` header.  
JWT is obtained via `/api/auth/login` and is valid for requests requiring authentication.

**Header Format:**  
```
Authorization: Bearer <token>
```
---

## **Endpoints**

### 1. Authentication

#### Register  

- **POST** `/api/auth/register`
- **Body:**
    ```json
    {
      "username": "string (min 3 chars, max 40)",
      "email": "user@example.com",
      "password": "string (min 6 chars)"
    }
    ```
- **Success:**  
    `201 Created`
    ```json
    { "message": "Registration successful" }
    ```
- **Failure:**
    - `400 Bad Request`: Validation errors (see example below) or duplicate username/email
    - `500 Internal Server Error`: Unhandled exception

    Example error:
    ```json
    {
        "errors": [
            { "msg": "Invalid value", "param": "email", ... }
        ]
    }
    ```
    or
    ```json
    { "error": "Username is already taken" }
    ```

#### Login

- **POST** `/api/auth/login`
- **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "string"
    }
    ```
- **Success:**
    ```json
    { "token": "<JWT>" }
    ```
- **Failure:**
    - `400 Bad Request`: Validation errors
    - `401 Unauthorized`: Invalid credentials
    - `500 Internal Server Error`: Unhandled exception

---

### 2. Products

#### List Products

- **GET** `/api/products`
- **Returns:** Array of all active products, with seller info
    ```json
    [
      {
        "id": 123,
        "seller_id": 2,
        "name": "Mountain Bike",
        "description": "...",
        "price": "329.99",
        "is_active": 1,
        "created_at": "...",
        "updated_at": "...",
        "seller_username": "...",
        "seller_display_name": "..."
      }
    ]
    ```
- **Errors:** `500 Internal Server Error`

#### Get Product Details

- **GET** `/api/products/:id`
- **Returns:**
    ```json
    {
      "id": 123,
      "seller_id": 2,
      "name": "...",
      "description": "...",
      "price": "329.99",
      "...": "...",
      "images": [
         {"id": 22, "image_url": "/uploads/xy.jpg", "is_primary": 1}
      ]
    }
    ```
- **Errors:** `404 Not Found`, `500 Internal Server Error`


#### Create Product  🔒

- **POST** `/api/products`
- **Auth:** JWT required (seller)
- **Body:**
    ```json
    {
      "name": "string (min 2 chars)",
      "description": "string (optional)",
      "price": 330.99
    }
    ```
- **Success:**  `201 Created`
    ```json
    { "id": 3, "message": "Product created" }
    ```
- **Failure:**
    - `400 Bad Request` (validation)
    - `401 Unauthorized` (missing/invalid token)
    - `500 Internal Server Error`

#### Update Product  🔒 (Seller only)

- **PUT** `/api/products/:id`
- **Body (any):**
    ```json
    {
        "name": "string",
        "description": "string",
        "price": 100.00,
        "is_active": 1
    }
    ```
- **Success:**  `200 OK`
    ```json
    { "message": "Product updated" }
    ```
- **Errors:**
    - `404 Not Found`
    - `403 Forbidden`: User not seller
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### Delete Product  🔒 (Seller only)

- **DELETE** `/api/products/:id`
- **Success:** `{ "message": "Deleted" }`
- **Errors:**  
    - `404 Not Found`
    - `403 Forbidden`
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### Upload Product Images 🔒 (Seller only)

- **POST** `/api/products/:id/images`
- **Request:** `multipart/form-data` (`images[]` = up to 5 files)
- **Success:**
    ```json
    {
      "message": "Images uploaded",
      "files": ["/uploads/file1.jpg", "/uploads/file2.jpg"]
    }
    ```
- **Errors:**  
    - `404 Not Found`
    - `403 Forbidden`
    - `400 Bad Request` (no images)
    - `500 Internal Server Error`

---

### 3. Users

#### Get Current Profile  🔒

- **GET** `/api/users/me`
- **Success:**
    ```json
    {
      "id": 42,
      "username": "alice",
      "email": "alice@example.com",
      "display_name": "...",
      "profile_image_url": "...",
      "created_at": "..."
    }
    ```
- **Errors:**  
    - `404 Not Found`
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### Update Current Profile  🔒

- **PUT** `/api/users/me`
- **Body (any):**
    ```json
    {
      "display_name": "Alice",
      "profile_image_url": "https://..."
    }
    ```
- **Success:**  `{ "message": "Profile updated" }`
- **Errors:**  
    - `400 Bad Request`
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### View Public User Profile

- **GET** `/api/users/:id`
- **Returns:**
    ```json
    {
      "id": 2,
      "username": "bob",
      "display_name": "Bob",
      "profile_image_url": "..."
    }
    ```
- **Errors:**  
    - `404 Not Found`
    - `500 Internal Server Error`

---

### 4. Chat

#### Fetch Messages with User  🔒

- **GET** `/api/chat/:userId`
- **Returns:** Array of messages, sorted by time ascending.  
    ```json
    [
      {
        "id": 55,
        "sender_id": 2,
        "receiver_id": 3,
        "product_id": 1,
        "message": "Hi!",
        "sent_at": "2024-04-11T15:00:00Z",
        "is_read": false
      }
    ]
    ```
- **Errors:**  
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### Send Message to User  🔒

- **POST** `/api/chat/:userId`
- **Body:**  
    ```json
    {
      "message": "Hello, is this still available?",
      "product_id": 1    // optional
    }
    ```
- **Success:**  `201 Created`
    ```json
    { "message": "Sent" }
    ```
- **Errors:**  
    - `400 Bad Request` (`message` missing)
    - `401 Unauthorized`
    - `500 Internal Server Error`

---

### 5. Payments

#### Webhook/Callback

- **POST** `/api/payments/callback`
- **Body:** (processor-specific, not strictly validated)
    ```json
    {
      "event": "payment_succeeded",
      ...
    }
    ```
- **Success:** 
    ```json
    { "status": "received", "event": "..." }
    ```
- **Errors:**  
    - `500 Internal Server Error`

---

### 6. Settings

#### Get User Settings  🔒

- **GET** `/api/settings/me`
- **Success:**  
    ```json
    {
      "id": 1,
      "user_id": 42,
      "email_notifications": true,
      "push_notifications": false,
      "dark_mode": false,
      "language": "en",
      ...
    }
    ```
- **Errors:**  
    - `404 Not Found`
    - `401 Unauthorized`
    - `500 Internal Server Error`

#### Update Settings  🔒

- **PUT** `/api/settings/me`
- **Body (any):**
    ```json
    {
      "email_notifications": true,
      "push_notifications": false,
      "dark_mode": true,
      "language": "es"
    }
    ```
- **Success:**  `{ "message": "Settings updated" }`
- **Errors:**  
    - `400 Bad Request`
    - `401 Unauthorized`
    - `500 Internal Server Error`

---

## **Authentication & Security Model**

- All endpoints that change or view user, product, chat, or settings data require JWT token (`🔒`).
- Use `/api/auth/login` to obtain a JWT for `Authorization` header; see above for header format.
- Attempting access with missing or expired tokens will yield `401 Unauthorized` with error messages (see `src/middleware/auth.js`).

---

## **Error Handling & Status Codes**

- Standard status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- 4xx status returns a JSON body, typically with an `error`, `errors`, or message for debugging or UI display.
    Example:
    ```json
    { "error": "Invalid or expired token" }
    ```
- 500 error bodies:  
    ```json
    { "error": "Internal server error" }
    ```

---

## **Payload Examples and Assumptions**

For any `date/time` fields, the value is ISO8601 UTC.  
Product price is a decimal string.  
Image URLs starting with `/uploads/` refer to files on the same host as API.

---

## **Changelog & Notes**

- This API doc is directly synced to backend code in `src/routes/*.js`.
- Integration or further advanced API details (pagination, filtering, chat read status, etc.) may depend on schema-level changes.

---

## **See Also**
- `schema.sql`: underlying MySQL data schema reference.
- `/uploads/`: path where file uploads are stored.
- `.env.example`: for configuration settings.

---

Task completed: Full backend API documentation for Easy Buy Database written, covering endpoints, authentication, request/response formats, and error/status semantics.
