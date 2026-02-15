/**
 * Type definitions for Supabase file upload utilities
 */

export interface UploadResult {
	path: string;
	publicUrl: string;
	fullPath: string;
}

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export interface FileListItem {
	id: string;
	name: string;
	updated_at: string;
	created_at: string;
	last_modified: string;
	metadata?: Record<string, any>;
}

export interface UploadOptions {
	contentType?: string;
	cacheControl?: string;
	upsert?: boolean;
	metadata?: Record<string, any>;
}

export interface StorageError {
	message: string;
	status?: number;
	code?: string;
}

export type FileUploaderBucket =
	| "uploads"
	| "avatars"
	| "documents"
	| "images"
	| string;
