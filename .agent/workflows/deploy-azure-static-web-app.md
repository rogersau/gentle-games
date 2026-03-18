---
description: Deploy the docs/ folder to Azure Static Web Apps
---

# Deploy to Azure Static Web App

This workflow deploys the static HTML files in `docs/` to a pre-existing Azure Static Web App.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- You have created the Azure Static Web App in the Azure Portal and have the **deployment token**
- The deployment token is stored in the environment variable `AZURE_STATIC_WEB_APPS_API_TOKEN`
  or you will be prompted to enter it

## Steps

1. Verify the files you are about to deploy

```
Get-ChildItem e:\Git\gentle-match\docs
```

2. Install the SWA CLI if not already installed (one-time setup)
   // turbo

```
npm install -g @azure/static-web-apps-cli
```

3. Check you are logged in to Azure

```
az account show
```

4. Deploy the docs folder to your Azure Static Web App.
   Replace `YOUR_DEPLOYMENT_TOKEN` with the token from the Azure Portal under
   Settings > Deployment token of your Static Web App resource.
   // turbo

```
swa deploy e:\Git\gentle-match\docs --deployment-token $env:AZURE_STATIC_WEB_APPS_API_TOKEN --env production
```

**Tip:** To avoid typing the token each time, add it to your environment:

```
$env:AZURE_STATIC_WEB_APPS_API_TOKEN = "your-token-here"
```

Or store it permanently in Windows via System Properties > Advanced > Environment Variables.

5. After deployment, confirm the site is live by opening the URL shown in the deployment output.
   Your custom domain `gentlegames.org` will need to be configured in the Azure Portal under
   **Settings > Custom domains** of your Static Web App.

## Notes

- The `docs/` folder contains `index.html`, `privacy-policy.html`, and `support.html`.
- Azure Static Web Apps will serve `index.html` at the root (`/`) automatically.
- No build step is needed — these are plain HTML files.
- To set up automatic deployments on git push, connect the GitHub repository to your
  Azure Static Web App via the Azure Portal (Settings > Deployment > GitHub).
