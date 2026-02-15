# Supabase File Uploader

A modern, fully-featured file upload component that uses Supabase Storage for file management.

## Features

- 📤 Drag & drop file upload
- 📊 Real-time upload progress tracking
- 🔒 Server-side validation with signed URLs
- 📝 File type and size validation
- 🖼️ Image preview support
- ⚡ Optimized performance with progress simulation
- 🎨 Beautiful UI with Tailwind CSS
- ♿ Accessible and responsive design

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Create Storage Bucket in Supabase

Go to your Supabase dashboard and create a storage bucket named `uploads` (or use a custom name).

#### Configure CORS (Optional)

If you need to configure CORS rules, run these SQL commands in the Supabase SQL editor:

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

## Usage

### Basic Usage

```tsx
import { FileUploader } from "@/utils/S3_Uploader/uploader.client";

export function MyUploadComponent() {
	return (
		<FileUploader
			bucket='uploads'
			onUploadComplete={(publicUrl, filePath) => {
				console.log("File uploaded:", publicUrl);
			}}
			onError={(error) => {
				console.error("Upload error:", error);
			}}
		/>
	);
}
```

### Advanced Configuration

```tsx
<FileUploader
	bucket='uploads'
	acceptedFileTypes='.jpg,.jpeg,.png,.gif,.pdf'
	maxFileSize={5 * 1024 * 1024} // 5MB
	showPreview={true}
	onUploadComplete={(publicUrl, filePath) => {
		console.log("Upload done:", { publicUrl, filePath });
	}}
	onError={(error) => {
		console.error("Error:", error);
	}}
/>
```

### Props

```typescript
interface FileUploaderProps {
	bucket?: string; // Storage bucket name (default: "uploads")
	onUploadComplete?: (publicUrl: string, filePath: string) => void; // Called on success
	onError?: (error: string) => void; // Called on error
	acceptedFileTypes?: string; // Comma-separated file types (default: common types)
	maxFileSize?: number; // Max file size in bytes (default: 10MB)
	showPreview?: boolean; // Show image preview (default: true)
}
```

## Server Actions

### `uploadFile(bucket, path, fileBuffer, contentType)`

Upload a file directly to Supabase Storage.

```typescript
const result = await uploadFile(
	"uploads",
	"my-file.jpg",
	fileBuffer,
	"image/jpeg",
);
// Returns: { path, publicUrl, fullPath }
```

### `generateUploadSignedUrl(bucket, path, expiresIn)`

Generate a signed URL for direct uploads (e.g., for large files).

```typescript
const signedUrl = await generateUploadSignedUrl(
	"uploads",
	"my-file.jpg",
	3600, // expires in 1 hour
);
```

### `deleteFile(bucket, path)`

Delete a file from storage.

```typescript
await deleteFile("uploads", "my-file.jpg");
```

### `listFiles(bucket, path)`

List files in a bucket or directory.

```typescript
const files = await listFiles("uploads", "folder/");
```

## File Structure

```
S3_Uploader/
├── blob.server.ts          # Server actions for Supabase operations
├── uploader.client.tsx     # Main upload component
├── supabase.client.ts      # Supabase client utilities
├── example.tsx             # Usage example
└── README.md              # This file
```

## Migration from S3

If you're migrating from AWS S3:

1. ✅ Replace API calls from `blob.server.ts`
2. ✅ Update environment variables from S3 to Supabase
3. ✅ Use `FileUploader` component instead of old uploader
4. ✅ Remove AWS SDK dependencies: `npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
5. ✅ Add Supabase: `npm install @supabase/supabase-js`

## Error Handling

The component handles various error scenarios:

- File size validation
- File type validation
- Network errors
- Supabase service errors

All errors are passed to the `onError` callback and displayed in the UI.

## Security Considerations

- 🔐 Server-side validation is performed for all uploads
- 🔐 Service Role Key is used only on the server
- 🔐 Anon Key is used safely on the client
- 🔐 File paths are timestamped to prevent collisions
- 🔐 Consider implementing additional RLS policies in Supabase

## Best Practices

1. **Set up RLS Policies** in Supabase to control who can upload/download
2. **Validate file types** on both client and server
3. **Implement rate limiting** to prevent abuse
4. **Use signed URLs** for sensitive files
5. **Monitor storage usage** in Supabase dashboard
6. **Set up automatic cleanup** for old uploads (if needed)

## Troubleshooting

### CORS Errors

- Ensure the CORS rules are configured in Supabase storage bucket settings
- Verify your domain is in the `allowed_origins` list

### Authentication Errors

- Check that environment variables are correctly set
- Verify the Anon Key has permission for storage access

### File Type Errors

- Ensure the `acceptedFileTypes` prop matches your file types
- Check MIME type configuration if needed

## Support & Contributing

For issues or improvements, please create a GitHub issue or submit a pull request.
