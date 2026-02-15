
export type BlobData = {
	bucketName: string;
	fileName: string;
	blobData: Blob | Buffer | string;
	ContentType?: string;
};
