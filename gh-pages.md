# Deployment to GitHub Pages

This project is optimized for deployment to GitHub Pages.

## Prerequisites

1.  **GitHub Repository**: Ensure your project is pushed to a GitHub repository.
2.  **Node.js**: Ensure you have Node.js installed.

## Steps to Deploy

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Deploy**:
    Run the following command to build and deploy your application:
    ```bash
    npm run deploy
    ```

    This command will:
    *   Run `npm run build` to create a production build in the `dist` folder.
    *   Push the contents of the `dist` folder to the `gh-pages` branch of your repository.

3.  **Configure GitHub Pages**:
    *   Go to your repository on GitHub.
    *   Navigate to **Settings** > **Pages**.
    *   Under **Source**, select `Deploy from a branch`.
    *   Select the `gh-pages` branch and save.

## Troubleshooting

*   **404 on Refresh**: This project uses `HashRouter` (`/#/`) to prevent 404 errors on refresh, which is common with single-page applications on static hosts like GitHub Pages.
*   **Assets Not Loading**: The `vite.config.ts` file is configured with `base: './'` to ensure assets load correctly regardless of the repository name.

## Manual Build

If you want to build the project manually without deploying:
```bash
npm run build
```
The output will be in the `dist` directory.
