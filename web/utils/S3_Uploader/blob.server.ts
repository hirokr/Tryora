"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase configuration in environment variables");
}

// Use service role key on server for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function generateUploadSignedUrl(
	bucket: string,
	path: string,
	expiresIn: number = 3600,
) {
	try {
		const { data, error } = await supabase.storage
			.from(bucket)
			.createSignedUrl(path, expiresIn);

		if (error) {
			throw new Error(`Failed to generate signed URL: ${error.message}`);
		}

		return data.signedUrl;
	} catch (error) {
		console.error("Error generating upload URL:", error);
		throw error;
	}
}

export async function uploadFile(
	bucket: string,
	path: string,
	fileBuffer: Buffer,
	contentType: string,
) {
	try {
		const { data, error } = await supabase.storage
			.from(bucket)
			.upload(path, fileBuffer, {
				contentType: contentType,
				upsert: false,
			});

		if (error) {
			throw new Error(`Upload failed: ${error.message}`);
		}

		// Get public URL
		const { data: publicUrlData } = supabase.storage
			.from(bucket)
			.getPublicUrl(path);

		return {
			path: data.path,
			publicUrl: publicUrlData.publicUrl,
			fullPath: data.fullPath,
		};
	} catch (error) {
		console.error("Error uploading file:", error);
		throw error;
	}
}

export async function deleteFile(bucket: string, path: string) {
	try {
		const { error } = await supabase.storage.from(bucket).remove([path]);

		if (error) {
			throw new Error(`Delete failed: ${error.message}`);
		}

		return { success: true };
	} catch (error) {
		console.error("Error deleting file:", error);
		throw error;
	}
}

export async function listFiles(bucket: string, path?: string) {
	try {
		const { data, error } = await supabase.storage.from(bucket).list(path);

		if (error) {
			throw new Error(`List failed: ${error.message}`);
		}

		return data;
	} catch (error) {
		console.error("Error listing files:", error);
		throw error;
	}
}
