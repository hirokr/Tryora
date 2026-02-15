# Supabase File Upload Integration Guide

This guide walks you through integrating the new Supabase-based file upload system into your Next.js application.

## 📋 Steps to Get Started

### 1. Install Dependencies

```bash
cd web
npm install
```

This will install `@supabase/supabase-js` which is now included in package.json.

> **Note:** AWS S3 SDK dependencies have been removed. If you still need them, you can reinstall with:
>
> ```bash
> npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
> ```

### 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create/login to your project
2. Navigate to **Settings → API** in the left sidebar
3. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Environment Variables

Create a `.env.local` file in the `web` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **Create new bucket**
3. Name it `uploads`
4. Toggle **Public bucket** (if you want public URLs)
5. Click **Create bucket**

### 5. Configure CORS (Optional but Recommended)

If you're getting CORS errors, run this SQL in Supabase dashboard (SQL Editor):

```sql
INSERT INTO storage.buckets (id, name, public, cors_rules)
VALUES (
  'uploads',
  'uploads',
  true,
  '[{
    "allowed_origins": ["http://localhost:3000", "https://yourdomain.com"],
    "allowed_methods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "allowed_headers": ["*"],
    "max_age_seconds": 3600
  }]'
)
ON CONFLICT (id) DO UPDATE SET cors_rules = excluded.cors_rules;
```

### 6. Use the Component

Import and use the FileUploader in your pages:

```tsx
import { FileUploader } from "@/utils/S3_Uploader";

export default function MyPage() {
	return (
		<FileUploader
			bucket='uploads'
			onUploadComplete={(publicUrl, filePath) => {
				console.log("File uploaded:", publicUrl);
			}}
		/>
	);
}
```

Or use the complete example:

```tsx
import { UploadExample } from "@/utils/S3_Uploader";

export default function UploadPage() {
	return <UploadExample />;
}
```

## 📁 File Structure

```
web/utils/S3_Uploader/
├── blob.server.ts          # Server-side upload functions
├── uploader.client.tsx     # Main upload component
├── supabase.client.ts      # Supabase client initialization
├── example.tsx             # Full example implementation
├── index.tsx               # Barrel export file
├── README.md               # Detailed documentation
├── .env.example            # Example environment variables
└── (other files)
```

## 🚀 Available Functions

### FileUploader Component

Main React component for file uploads with drag-and-drop support.

```tsx
<FileUploader
	bucket='uploads'
	acceptedFileTypes='.jpg,.jpeg,.png'
	maxFileSize={5 * 1024 * 1024}
	showPreview={true}
	onUploadComplete={(url, path) => {}}
	onError={(error) => {}}
/>
```

### Server Actions

```typescript
// Upload a file
const result = await uploadFile(bucket, path, fileBuffer, contentType);

// Generate signed URL (for other services)
const url = await generateUploadSignedUrl(bucket, path);

// Delete a file
await deleteFile(bucket, path);

// List files
const files = await listFiles(bucket, path);
```

## 🔒 Security Considerations

1. **Environment Variables:**
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose
   - ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client

2. **Row Level Security (RLS):**
   - Set up RLS policies in Supabase for your storage buckets
   - Prevent unauthorized access to uploads

3. **File Validation:**
   - The component validates file type and size on the client
   - Always validate on the server too (already done in blob.server.ts)

## 🧪 Testing

You can test the upload functionality by:

1. Starting the dev server:

   ```bash
   npm run dev
   ```

2. Using the example component:

   ```tsx
   import { UploadExample } from "@/utils/S3_Uploader";

   export default function TestPage() {
   	return <UploadExample />;
   }
   ```

3. Or create a test page:

   ```tsx
   import { FileUploader } from "@/utils/S3_Uploader";

   export default function UploadTest() {
   	return (
   		<FileUploader
   			onUploadComplete={(url) => console.log("Success:", url)}
   			onError={(err) => console.error("Error:", err)}
   		/>
   	);
   }
   ```

## 🐛 Troubleshooting

### CORS Errors

- Ensure bucket is public (for public uploads)
- Run the CORS SQL configuration above
- Check that your domain is in `allowed_origins`

### Authentication Errors

- Verify environment variables are set correctly
- Check that ANON_KEY has storage permissions

### File Upload Fails

- Check browser console for specific error messages
- Verify file size is within limit
- Ensure file type is in `acceptedFileTypes`

### Missing Types

- Run `npm install`
- Restart TypeScript server (`Cmd+Shift+P` → "TypeScript: Restart TS Server")

## 📚 Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

## 🔄 Migration from Previous Setup

If you were using the old S3 uploader:

1. ✅ Update imports to use new components
2. ✅ Update environment variables to Supabase ones
3. ✅ Update bucket name if different
4. ✅ Test all upload functionality
5. ✅ Remove old S3 SDK dependencies (optional)

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set in `.env.local`
- [ ] Supabase project created and accessible
- [ ] Storage bucket "uploads" created
- [ ] Can import `FileUploader` without errors
- [ ] Test page loads and renders upload component
- [ ] Can upload test file successfully
- [ ] File appears in Supabase Storage dashboard
- [ ] Public URL works in browser

## 💡 Tips

- Use the `example.tsx` as a reference implementation
- Read through `README.md` in the S3_Uploader folder for detailed documentation
- Check Supabase dashboard for storage usage and file listing
- Implement error boundary for production readiness
- Consider adding retry logic for failed uploads

---

For detailed component documentation, see [S3_Uploader/README.md](./utils/S3_Uploader/README.md)
