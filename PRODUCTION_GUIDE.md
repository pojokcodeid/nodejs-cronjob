# Production Deployment Guide (Windows Server)

This guide details the steps to deploy and run the `nodejs-cron-job` application on a Windows Server environment using PM2.

## prerequisites

Ensure the server has the following installed:

1.  **Node.js** (LTS version recommended): [Download](https://nodejs.org/)
2.  **Git**: [Download](https://git-scm.com/)
3.  **PowerShell** (Run as Administrator)

## 1. Installation

Clone the repository and install dependencies:

```powershell
# Clone the repository (replace URL with your repo)
git clone <repository_url>
cd nodejs-cron-job

# Install dependencies
npm install --production
```

## 2. Configuration

Create a `.env` file in the root directory if it doesn't exist. You can copy it from a template if available.

```ini
# .env example
PORT=3000
NODE_ENV=production
# Add other necessary environment variables here
```

## 3. Running with PM2

We use **PM2** to manage the application process.

### Start the Application

To start the application using the configured ecosystem file:

```powershell
npx pm2 start ecosystem.config.cjs
```

### Check Status

Verify the application is running:

```powershell
npx pm2 list
```

### View Logs

Monitor application logs:

```powershell
npx pm2 logs nodejs-cron-job
```

## 4. Auto-Startup Configuration (Windows)

To ensure the application restarts automatically after a server reboot, follow these steps ONE TIME:

1.  **Install Global Dependencies**:
    Ensure PM2 is installed globally (required for the service):

    ```powershell
    npm install -g pm2 pm2-windows-startup
    ```

2.  **Install the Service**:

    ```powershell
    pm2-startup install
    ```

3.  **Save Current List**:
    Ensure your app is running (`npx pm2 list`), then save the list to be resurrected on startup:
    ```powershell
    npx pm2 save
    ```

## 5. Verifying Auto-Startup

After restarting the server, verify that the application has started automatically:

1.  **Check PM2 List**:
    Open PowerShell and run:

    ```powershell
    npx pm2 list
    ```

    - Check that your app is listed.
    - Status should be `online`.
    - `uptime` should be small (indicating it just started).

2.  **Check Windows Service**:
    Verify the PM2 service is running:
    ```powershell
    Get-Service *pm2*
    ```
    Status should be `Running`.

## 6. Maintenance / Updates

To update the application:

1.  **Pull latest code**:

    ```powershell
    git pull origin main
    ```

2.  **Install new dependencies**:

    ```powershell
    npm install --production
    ```

3.  **Restart the application**:
    ```powershell
    npx pm2 reload ecosystem.config.cjs
    ```

## 7. Cleaning Up (Uninstalling Service)

If you need to remove the auto-startup configuration and stop the application (e.g., after testing):

1.  **Stop and Delete the Process**:

    ```powershell
    npx pm2 stop nodejs-cron-job
    npx pm2 delete nodejs-cron-job
    npx pm2 save --force
    ```

2.  **Remove the Windows Service**:

    ```powershell
    pm2-startup uninstall
    ```

3.  **Confirm Removal**:
    Verify the service is gone and the process list is empty:
    ```powershell
    Get-Service *pm2*
    npx pm2 list
    ```
    - `Get-Service` should return an error or show nothing.
    - `pm2 list` should show an empty table.
