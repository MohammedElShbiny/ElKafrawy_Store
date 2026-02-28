
# 🔴 URGENT: Fix "Missing Permissions" Error

The app is trying to connect to Google Firebase, but the server is blocking the connection.
This is because new databases are often created in "Locked Mode".

**You must perform these 4 steps to fix the error:**

1.  Go to the Firebase Console: **https://console.firebase.google.com/**
2.  Click on your project: **elkafrawy-store**
3.  In the left sidebar, click **Build** > **Firestore Database**.
    *   (If you haven't clicked "Create Database" yet, click it now and select **Test Mode**).
4.  Click the **Rules** tab at the top.
5.  Replace the code with this (change `false` to `true`):

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```

6.  Click **Publish**.

**Once you click Publish, refresh your website. The error will disappear.**
