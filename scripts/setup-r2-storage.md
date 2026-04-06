# Cloudflare R2 Storage Setup for Vuon LMS

## 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Storage & Databases → R2
2. Click **Create Bucket**
3. Name: `vuon-lms-media`
4. Location: Choose closest to your students (e.g., APAC for Vietnam)

## 2. Generate API Credentials

1. Go to R2 → Overview → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Permissions: **Object Read & Write**
4. Scope: Limit to `vuon-lms-media` bucket
5. Save the **Access Key ID** and **Secret Access Key**

## 3. Configure in Frappe

1. Log in to your LMS as Administrator
2. Go to URL: `/app/dfp-external-storage`
3. Click **+ Add DFP External Storage**
4. Fill in:

| Field | Value |
|-------|-------|
| **Name** | Cloudflare R2 |
| **S3 Bucket Name** | `vuon-lms-media` |
| **S3 Endpoint URL** | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| **Access Key ID** | Your R2 Access Key |
| **Secret Access Key** | Your R2 Secret Key |
| **Region** | `auto` |
| **Use Presigned URLs** | Yes (enables secure, time-limited access) |
| **Presigned URL Expiry** | 3600 (1 hour, adjust as needed) |
| **Assign to Folder** | Home (all files) |

5. Click **Save**

## 4. Verify

1. Upload a test file via the LMS course editor
2. Check R2 bucket in Cloudflare dashboard — file should appear
3. Access the file via the LMS — should load via pre-signed URL

## Cost Estimate

| Usage | Amount | Monthly Cost |
|-------|--------|-------------|
| Storage (20 sessions × ~1GB video) | ~20 GB | $0.30 |
| Storage (slides, PDFs, recaps) | ~1 GB | $0.015 |
| Class A operations (uploads) | ~1,000 | $0.0045 |
| Class B operations (reads) | ~50,000 | $0.18 |
| **Egress** | **Unlimited** | **$0.00** |
| **Total** | | **~$0.50/mo** |

## Optional: Custom Domain for R2

To serve files from a branded URL (e.g., `media.vuon.io`):

1. In R2 bucket settings → **Custom Domains**
2. Add your subdomain (must be on a Cloudflare-managed zone)
3. Cloudflare handles SSL automatically
