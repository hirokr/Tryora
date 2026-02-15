"use client";

import { useState } from "react";
import { uploadFile, generateUploadSignedUrl } from "./blob.server";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadState {
	isLoading: boolean;
	progress: number;
	fileName: string | null;
	error: string | null;
	success: boolean;
	publicUrl: string | null;
}

export interface FileUploaderProps {
	bucket?: string;
	onUploadComplete?: (publicUrl: string, filePath: string) => void;
	onError?: (error: string) => void;
	acceptedFileTypes?: string;
	maxFileSize?: number; // in bytes
	showPreview?: boolean;
}

export function FileUploader({
	bucket = "uploads",
	onUploadComplete,
	onError,
	acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx",
	maxFileSize = 10 * 1024 * 1024, // 10MB default
	showPreview = true,
}: FileUploaderProps) {
	const [state, setState] = useState<FileUploadState>({
		isLoading: false,
		progress: 0,
		fileName: null,
		error: null,
		success: false,
		publicUrl: null,
	});

	const [dragActive, setDragActive] = useState(false);

	const validateFile = (file: File): string | null => {
		if (file.size > maxFileSize) {
			return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`;
		}

		const fileExtension = file.name.split(".").pop()?.toLowerCase();
		const allowedExtensions = acceptedFileTypes
			.split(",")
			.map((ext) => ext.trim().replace(".", "").toLowerCase());

		if (!allowedExtensions.includes(fileExtension || "")) {
			return `File type not allowed. Accepted types: ${acceptedFileTypes}`;
		}

		return null;
	};

	const handleUpload = async (file: File) => {
		const validationError = validateFile(file);
		if (validationError) {
			setState((prev) => ({ ...prev, error: validationError }));
			onError?.(validationError);
			return;
		}

		setState({
			isLoading: true,
			progress: 0,
			fileName: file.name,
			error: null,
			success: false,
			publicUrl: null,
		});

		try {
			// Simulate progress
			const progressInterval = setInterval(() => {
				setState((prev) => ({
					...prev,
					progress: Math.min(prev.progress + Math.random() * 30, 90),
				}));
			}, 200);

			// Read file as buffer
			const fileBuffer = await file.arrayBuffer();

			// Upload file
			const result = await uploadFile(
				bucket,
				`${Date.now()}-${file.name}`,
				Buffer.from(fileBuffer),
				file.type,
			);

			clearInterval(progressInterval);

			setState({
				isLoading: false,
				progress: 100,
				fileName: file.name,
				error: null,
				success: true,
				publicUrl: result.publicUrl,
			});

			onUploadComplete?.(result.publicUrl, result.path);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Upload failed";
			setState({
				isLoading: false,
				progress: 0,
				fileName: file.name,
				error: errorMessage,
				success: false,
				publicUrl: null,
			});
			onError?.(errorMessage);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleUpload(file);
		}
	};

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const file = e.dataTransfer.files?.[0];
		if (file) {
			handleUpload(file);
		}
	};

	const resetState = () => {
		setState({
			isLoading: false,
			progress: 0,
			fileName: null,
			error: null,
			success: false,
			publicUrl: null,
		});
	};

	return (
		<div className='w-full max-w-md mx-auto'>
			<div
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
				className={`relative rounded-lg border-2 border-dashed transition-colors p-6 ${
					dragActive
						? "border-blue-500 bg-blue-50"
						: "border-gray-300 bg-gray-50"
				} ${state.isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<input
					type='file'
					onChange={handleFileInputChange}
					disabled={state.isLoading}
					accept={acceptedFileTypes}
					className='hidden'
					id='file-input'
				/>

				<label
					htmlFor='file-input'
					className='flex flex-col items-center justify-center cursor-pointer'
				>
					<Upload className='w-8 h-8 text-gray-400 mb-2' />
					<span className='text-sm font-medium text-gray-700'>
						Drag file here or click to select
					</span>
					<span className='text-xs text-gray-500 mt-1'>
						Max {maxFileSize / (1024 * 1024)}MB
					</span>
				</label>
			</div>

			{/* Upload Status */}
			{state.fileName && (
				<div className='mt-4 p-4 bg-white rounded-lg border border-gray-200'>
					<div className='flex items-center justify-between mb-2'>
						<span className='text-sm font-medium text-gray-700 truncate'>
							{state.fileName}
						</span>
						<button
							onClick={resetState}
							disabled={state.isLoading}
							className='p-1 hover:bg-gray-100 rounded'
						>
							<X className='w-4 h-4 text-gray-500' />
						</button>
					</div>

					{/* Progress Bar */}
					{state.isLoading && (
						<div className='w-full bg-gray-200 rounded-full h-2'>
							<div
								className='bg-blue-500 h-2 rounded-full transition-all duration-300'
								style={{ width: `${state.progress}%` }}
							/>
						</div>
					)}

					{/* Error Message */}
					{state.error && (
						<div className='flex items-center gap-2 text-red-600 text-sm mt-2'>
							<AlertCircle className='w-4 h-4' />
							<span>{state.error}</span>
						</div>
					)}

					{/* Success Message */}
					{state.success && (
						<div className='flex items-center gap-2 text-green-600 text-sm mt-2'>
							<CheckCircle className='w-4 h-4' />
							<span>Upload successful!</span>
						</div>
					)}

					{/* File Preview */}
					{showPreview &&
						state.success &&
						state.publicUrl &&
						state.fileName &&
						/\.(jpg|jpeg|png|gif|webp)$/i.test(state.fileName) && (
							<div className='mt-3'>
								<img
									src={state.publicUrl}
									alt='Preview'
									className='w-full h-32 object-cover rounded'
								/>
							</div>
						)}

					{/* Public URL */}
					{state.success && state.publicUrl && (
						<details className='mt-3 text-xs'>
							<summary className='cursor-pointer text-gray-600'>
								View file info
							</summary>
							<div className='mt-2 p-2 bg-gray-100 rounded text-gray-700 break-all'>
								<p className='font-mono'>{state.publicUrl}</p>
							</div>
						</details>
					)}
				</div>
			)}
		</div>
	);
}
