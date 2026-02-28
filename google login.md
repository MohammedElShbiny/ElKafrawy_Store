# Google Login Setup Guide

To enable Google Login for your Firebase application, follow these steps:

1.  **Go to the Firebase Console**:
    *   Navigate to [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Select your project (`elkafrawy-store` or your specific project ID).

2.  **Enable Authentication**:
    *   Click on **Authentication** in the left sidebar.
    *   Click on the **Sign-in method** tab.
    *   Click on **Add new provider**.
    *   Select **Google**.

3.  **Configure Google Sign-In**:
    *   Toggle the **Enable** switch.
    *   Enter a **Project public-facing name** (e.g., "Elkafrawy Store").
    *   Select a **Project support email** from the dropdown.
    *   Click **Save**.

4.  **Add Authorized Domains** (Important for production):
    *   In the **Settings** tab of Authentication (or under Authorized Domains in Sign-in method), ensure your app's domain is listed.
    *   Add `localhost` (for development).
    *   Add your deployed domain (e.g., `ais-dev-k564cwg673zbc7yj7eijqu-138717964571.europe-west2.run.app` or your custom domain).

5.  **Done!**
    *   The code is already set up to use `signInWithPopup` with `GoogleAuthProvider`.
    *   Users can now sign in using their Google accounts.
