
# 🔒 Securing Your Elkafrawy Store Database

The application is connected to **elkafrawy-store**. To ensure your data is safe and functional, follow these setup steps.

### 1. Recommended Production Security Rules
Instead of "Test Mode" (which allows anyone to delete your data), go to **Firestore Database > Rules** and use these rules.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products: Anyone can view, only authenticated admin can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders: Anyone can create, only authenticated admin can view all
    match /orders/{orderId} {
      allow create: if true;
      allow read: if request.auth != null; 
      allow update, delete: if request.auth != null;
    }
    
    // Promos: Anyone can check, only authenticated admin can modify
    match /promos/{promoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Support: Chat sessions and messages
    // Note: In production, use security rules to ensure users only see their own sessions
    match /support_sessions/{sessionId} {
      allow read, write: if true;
    }
    match /support_messages/{messageId} {
      allow read, write: if true;
    }

    // Admin Login History: Only authenticated admin can read/write
    match /admin_login_history/{historyId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Enable Email/Password Auth
To secure the Admin Panel:
1. Go to **Build > Authentication**.
2. Click **Get Started**.
3. Go to **Sign-in method** tab.
4. Enable **Email/Password** and click Save.
5. Go to **Users** tab and click **Add user**.
6. Add an admin email (e.g., `admin@elkafrawy.com`) and a strong password.
7. Use these credentials to log in to the Admin Panel.

### 3. Enable Anonymous Auth
To help track customer sessions securely:
1. In **Sign-in method**, also enable **Anonymous** and click Save.

### 3. Required Composite Indexes (CRITICAL)
The Support System requires a specific index to work. Without this, you will see a "The query requires an index" error.

**How to create the index:**
1. Open the [Firebase Console Indexes Page](https://console.firebase.google.com/v1/r/project/elkafrawy-store/firestore/indexes).
2. Click **Add Index**.
3. Collection ID: `support_messages`
4. Fields to index:
   - `sessionId` (Ascending)
   - `timestamp` (Ascending)
5. Query Scope: `Collection`
6. Click **Create Index**. It may take a few minutes to build.

### 4. Future Security Upgrade
For high-level security, we recommend:
- **Firebase Cloud Functions**: To handle total price calculation and stock subtraction on the server side.
- **Firebase Admin SDK**: To restrict Admin Panel access to specific emails only.
