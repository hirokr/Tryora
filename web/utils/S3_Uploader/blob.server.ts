"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
	throw new Error("Missing S3 configuration in environment variables");
}

const s3 = new S3Client({
	region: region,
	endpoint: endpoint,
	credentials: {
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey,
	},
	forcePathStyle: true,
});

export async function getUploadUrl(bucket: string, key: string) {
	// TODO: Validate user session here!
	const command = new PutObjectCommand({ Bucket: bucket, Key: key });
	const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
	return url;
}


// TODO: fix CORS for supabase using the following SQL commands in psql or pgAdmin:
// insert into storage.buckets (id, name, public)
// values ('my-bucket', 'my-bucket', true)
// on conflict (id) do nothing;

// -- Replace 'http://localhost:3000' with your production URL later
// insert into storage.buckets (id, name, public, cors_rules)
// values ('my-bucket', 'my-bucket', true, '[{
//   "allowed_origins": ["http://localhost:3000"],
//   "allowed_methods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
//   "allowed_headers": ["*"],
//   "max_age_seconds": 3600
// }]')
// on conflict (id) do update set cors_rules = excluded.cors_rules;