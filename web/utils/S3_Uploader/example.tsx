"use client";

import { useState } from "react";
import { FileUploader } from "./uploader.client";

export function UploadExample() {
	const [uploadedFiles, setUploadedFiles] = useState<
		Array<{ url: string; path: string }>
	>([]);

	const handleUploadComplete = (publicUrl: string, filePath: string) => {
		setUploadedFiles((prev) => [...prev, { url: publicUrl, path: filePath }]);
	};

	const handleError = (error: string) => {
		console.error("Upload failed:", error);
		// You can also show a toast notification here
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8'>
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='mb-12'>
					<h1 className='text-4xl font-bold text-gray-900 mb-2'>
						File Upload Manager
					</h1>
					<p className='text-gray-600'>
						Upload files securely to Supabase Storage
					</p>
				</div>

				{/* Upload Section */}
				<div className='bg-white rounded-xl shadow-lg p-8 mb-8'>
					<h2 className='text-2xl font-semibold text-gray-800 mb-6'>
						Upload New File
					</h2>

					<FileUploader
						bucket='uploads'
						acceptedFileTypes='.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt'
						maxFileSize={10 * 1024 * 1024} // 10MB
						showPreview={true}
						onUploadComplete={handleUploadComplete}
						onError={handleError}
					/>

					{/* Info Box */}
					<div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-800'>
							<strong>💡 Tip:</strong> You can drag and drop files, or click to
							browse.
						</p>
					</div>
				</div>

				{/* Uploaded Files Section */}
				{uploadedFiles.length > 0 && (
					<div className='bg-white rounded-xl shadow-lg p-8'>
						<h2 className='text-2xl font-semibold text-gray-800 mb-6'>
							Uploaded Files ({uploadedFiles.length})
						</h2>

						<div className='space-y-4'>
							{uploadedFiles.map((file, index) => (
								<div
									key={index}
									className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors'
								>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium text-gray-900 truncate'>
											{file.path}
										</p>
										<a
											href={file.url}
											target='_blank'
											rel='noopener noreferrer'
											className='text-sm text-blue-600 hover:text-blue-800 truncate block mt-1'
										>
											{file.url}
										</a>
									</div>
									<button
										onClick={() => {
											navigator.clipboard.writeText(file.url);
											alert("URL copied to clipboard!");
										}}
										className='ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors'
									>
										Copy URL
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Empty State */}
				{uploadedFiles.length === 0 && (
					<div className='bg-white rounded-xl shadow-lg p-8 text-center'>
						<p className='text-gray-500'>
							No files uploaded yet. Start by uploading a file above!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
