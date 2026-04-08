# Grant Service Account Permissions

## Service Account Details

**Email**: `firebase-adminsdk-1whdc@art-of-intent.iam.gserviceaccount.com`

**Project**: `art-of-intent`

## Required Permissions

The service account needs these IAM roles to deploy Cloud Functions:

### Step-by-Step Instructions

1. **Go to IAM Console**
   - Visit: https://console.cloud.google.com/iam-admin/iam?project=art-of-intent

2. **Find the Service Account**
   - Look for: `firebase-adminsdk-1whdc@art-of-intent.iam.gserviceaccount.com`
   - Click the pencil icon (Edit) next to it

3. **Add These Roles**
   Click "ADD ANOTHER ROLE" for each:
   
   - ✅ **Cloud Functions Admin**
     - Role ID: `roles/cloudfunctions.admin`
     - Allows: Create, update, delete functions
   
   - ✅ **Cloud Build Service Account**
     - Role ID: `roles/cloudbuild.builds.builder`
     - Allows: Build function code
   
   - ✅ **Service Usage Consumer**
     - Role ID: `roles/serviceusage.serviceUsageConsumer`
     - Allows: Check if APIs are enabled
   
   - ✅ **Artifact Registry Administrator**
     - Role ID: `roles/artifactregistry.admin`
     - Allows: Store function artifacts
   
   - ✅ **Cloud Scheduler Admin** (for scheduled function)
     - Role ID: `roles/cloudscheduler.admin`
     - Allows: Create scheduled jobs

4. **Save Changes**
   - Click "SAVE" at the bottom

## Alternative: Use Predefined Role

Instead of individual roles, you can grant:

- **Firebase Admin**
  - Role ID: `roles/firebase.admin`
  - Includes all necessary permissions

## Verification

After granting permissions, verify by running:

```bash
# In Gitpod terminal
cd /workspaces/art-of-intent
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/src/art-of-intent-firebase-adminsdk-1whdc-d407629ecd.json"
firebase deploy --only functions --project art-of-intent
```

## Expected Output

```
=== Deploying to 'art-of-intent'...

i  deploying functions
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudbuild.googleapis.com is enabled
i  artifactregistry: ensuring required API artifactregistry.googleapis.com is enabled...
✔  artifactregistry: required API artifactregistry.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X.XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 20 function artyGenerateHaiku...
✔  functions[artyGenerateHaiku] Successful create operation.
i  functions: creating Node.js 20 function generateDailyWords...
✔  functions[generateDailyWords] Successful create operation.

✔  Deploy complete!
```

## Troubleshooting

### Still Getting Permission Errors?

1. **Wait 1-2 minutes** after granting permissions (IAM changes take time to propagate)

2. **Check the service account exists**:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=art-of-intent
   - Verify `firebase-adminsdk-1whdc@art-of-intent.iam.gserviceaccount.com` is listed

3. **Verify APIs are enabled**:
   - Cloud Functions: https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=art-of-intent
   - Cloud Build: https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=art-of-intent
   - Artifact Registry: https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=art-of-intent

4. **Check billing is enabled**:
   - Go to: https://console.cloud.google.com/billing?project=art-of-intent
   - Ensure a billing account is linked

### Alternative: Deploy from Local Machine

If permissions are complex, deploy from your local machine:

```bash
git pull origin main
firebase login
firebase deploy --only functions
```

This uses your personal credentials which have full access.

## Quick Links

- [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=art-of-intent)
- [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=art-of-intent)
- [Cloud Functions](https://console.cloud.google.com/functions/list?project=art-of-intent)
- [Cloud Build](https://console.cloud.google.com/cloud-build/builds?project=art-of-intent)
- [APIs & Services](https://console.cloud.google.com/apis/dashboard?project=art-of-intent)
