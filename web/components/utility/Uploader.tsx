"use client";

import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";

export default function Uploader() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-between p-24'>
			<UploadButton
				endpoint='imageUploader'
				onClientUploadComplete={(res) => {
					// Do something with the response
					// console.log("Files: ", res);
					// alert("Upload Completed");
					toast.success("Upload Completed");
				}}
				onUploadError={(error: Error) => {
					// Do something with the error.
					toast.error(`ERROR! ${error.message}`);
				}}
			/>
		</div>
	);
}
