"use client";

import { getUploadUrl } from "./blob.server";

export function FileUploader() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the selected file from the input
    // TODO: Add client-side validation for file type and size here if needed
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadUrl = await getUploadUrl("my-bucket", file.name);

    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file, 
      headers: { "Content-Type": file.type },
    });

    if (response.ok) console.log("Direct upload successful!");
  };

  return <input type="file" onChange={handleUpload} />;
}
