"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/auth/clientAuthFetch";
import { useUploadThing } from "@/utils/uploadthing";

type ProfileResponse = {
	user?: {
		userBodyImageUrl?: string | null;
	};
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBadge({
	number,
	label,
	active,
	done,
}: {
	number: number;
	label: string;
	active: boolean;
	done: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<span
				className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
					done
						? "bg-emerald-500 text-white"
						: active
							? "bg-amber-400 text-[#0f0a1b]"
							: "border border-white/20 bg-white/5 text-slate-400"
				}`}
			>
				{done ? "✓" : number}
			</span>
			<span
				className={`text-sm font-medium transition-colors duration-300 ${
					done
						? "text-emerald-400"
						: active
							? "text-amber-200"
							: "text-slate-500"
				}`}
			>
				{label}
			</span>
		</div>
	);
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
function FileDropzone({
	onFileSelected,
	disabled,
}: {
	onFileSelected: (file: File) => void;
	disabled?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);

	const handleFiles = useCallback(
		(files: FileList | null) => {
			const file = files?.[0];
			if (!file) return;
			if (!file.type.startsWith("image/")) return;
			onFileSelected(file);
		},
		[onFileSelected],
	);

	return (
		<div
			role="button"
			tabIndex={disabled ? -1 : 0}
			aria-label="Select body image"
			onClick={() => !disabled && inputRef.current?.click()}
			onKeyDown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && !disabled)
					inputRef.current?.click();
			}}
			onDragOver={(e) => {
				e.preventDefault();
				if (!disabled) setDragging(true);
			}}
			onDragLeave={() => setDragging(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDragging(false);
				if (!disabled) handleFiles(e.dataTransfer.files);
			}}
			className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 select-none ${
				disabled
					? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50"
					: dragging
						? "border-amber-400/80 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
						: "border-white/20 bg-white/[0.03] hover:border-amber-400/50 hover:bg-amber-400/[0.03]"
			}`}
		>
			{/* Icon */}
			<div
				className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-200 ${
					dragging
						? "border-amber-400/60 bg-amber-400/10"
						: "border-white/15 bg-white/5"
				}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className={`h-5 w-5 transition-colors ${dragging ? "text-amber-300" : "text-slate-400"}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
					/>
				</svg>
			</div>

			<div>
				<p className="text-sm font-medium text-slate-200">
					{dragging ? "Drop to preview" : "Drop an image or click to browse"}
				</p>
				<p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP — max 4 MB</p>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				disabled={disabled}
				onChange={(e) => handleFiles(e.target.files)}
			/>
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UpdatePicsPage() {
	// Persisted URL from database
	const [savedBodyImageUrl, setSavedBodyImageUrl] = useState("");

	// File selected by user (pending upload)
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
		null,
	);

	// Uploaded (not yet saved to DB) URL
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// ── UploadThing programmatic hook ───────────────────────────────────────
	const { startUpload } = useUploadThing("imageUploader", {
		onClientUploadComplete: (files) => {
			const url = files?.[0]?.ufsUrl || files?.[0]?.url || "";
			if (!url) {
				setErrorMessage("Upload finished but no URL was returned.");
				setIsUploading(false);
				return;
			}
			setUploadedUrl(url);
			setIsUploading(false);
			setStatusMessage("Upload complete — save to apply changes.");
		},
		onUploadError: (err) => {
			setErrorMessage(err.message || "Upload failed. Please try again.");
			setIsUploading(false);
		},
	});

	// ── Load saved profile image ────────────────────────────────────────────
	useEffect(() => {
		const load = async () => {
			setIsLoadingProfile(true);
			try {
				const res = await authFetch("/api/user/me", { method: "GET" });
				const payload = (await res.json().catch(() => ({}))) as ProfileResponse;
				if (res.ok) {
					setSavedBodyImageUrl(payload.user?.userBodyImageUrl || "");
				} else {
					setErrorMessage("Unable to load your current profile image.");
				}
			} catch {
				setErrorMessage("Unable to load your current profile image.");
			} finally {
				setIsLoadingProfile(false);
			}
		};
		void load();
	}, []);

	// ── Revoke blob URLs on unmount / swap ──────────────────────────────────
	useEffect(() => {
		return () => {
			if (pendingPreviewUrl?.startsWith("blob:"))
				URL.revokeObjectURL(pendingPreviewUrl);
		};
	}, [pendingPreviewUrl]);

	// ── Handlers ────────────────────────────────────────────────────────────
	const handleFileSelected = useCallback(
		(file: File) => {
			// Revoke old blob
			if (pendingPreviewUrl?.startsWith("blob:"))
				URL.revokeObjectURL(pendingPreviewUrl);

			setPendingFile(file);
			setPendingPreviewUrl(URL.createObjectURL(file));
			setUploadedUrl(null);
			setStatusMessage(null);
			setErrorMessage(null);
		},
		[pendingPreviewUrl],
	);

	const handleUpload = useCallback(async () => {
		if (!pendingFile) return;
		setIsUploading(true);
		setStatusMessage("Uploading…");
		setErrorMessage(null);
		await startUpload([pendingFile]);
	}, [pendingFile, startUpload]);

	const handleSave = useCallback(async () => {
		const urlToSave = uploadedUrl;
		if (!urlToSave) return;

		setIsSaving(true);
		setStatusMessage(null);
		setErrorMessage(null);

		try {
			const res = await authFetch("/api/user/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userBodyImageUrl: urlToSave }),
			});

			if (!res.ok) {
				setErrorMessage("Failed to save. Please try again.");
				return;
			}

			setSavedBodyImageUrl(urlToSave);
			setPendingFile(null);
			if (pendingPreviewUrl?.startsWith("blob:"))
				URL.revokeObjectURL(pendingPreviewUrl);
			setPendingPreviewUrl(null);
			setUploadedUrl(null);
			setStatusMessage("Profile image updated successfully.");
		} catch {
			setErrorMessage("Failed to save. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}, [uploadedUrl, pendingPreviewUrl]);

	// ── Derived state for step indicator ────────────────────────────────────
	const step1Done = !!pendingFile || !!uploadedUrl;
	const step2Done = !!uploadedUrl;
	const step3Done = false; // resets after save

	const currentStep = !step1Done ? 1 : !step2Done ? 2 : 3;

	// Preview to display: pending blob → uploaded url → saved url
	const displayPreviewUrl = useMemo(
		() => pendingPreviewUrl || uploadedUrl || savedBodyImageUrl || null,
		[pendingPreviewUrl, uploadedUrl, savedBodyImageUrl],
	);

	const previewLabel = useMemo(() => {
		if (pendingPreviewUrl) return "Selected — not yet uploaded";
		if (uploadedUrl) return "Uploaded — ready to save";
		if (savedBodyImageUrl) return "Current saved image";
		return null;
	}, [pendingPreviewUrl, uploadedUrl, savedBodyImageUrl]);

	const previewBadgeColor = useMemo(() => {
		if (pendingPreviewUrl) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
		if (uploadedUrl) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
		return "bg-white/10 text-slate-400 border-white/15";
	}, [pendingPreviewUrl, uploadedUrl]);

	return (
		<main className="min-h-screen bg-[#0a0714] pt-20 text-slate-100">
			{/* Ambient gradient blobs */}
			<div
				aria-hidden
				className="pointer-events-none fixed inset-0 overflow-hidden"
			>
				<div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[120px]" />
				<div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-indigo-900/15 blur-[100px]" />
				<div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-amber-900/10 blur-[90px]" />
			</div>

			<section className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 sm:px-6">
				{/* ── Header ─────────────────────────────────────────────────────── */}
				<header className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1130]/80 via-[#1e1a35]/80 to-[#12192e]/80 px-6 py-7 backdrop-blur-sm">
					<span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
						Profile · Body Image
					</span>
					<h1 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">
						Update Your Body Image
					</h1>
					<p className="mt-1.5 text-sm text-slate-400">
						Select a photo, preview it instantly, then upload and save.
					</p>

					{/* Step indicators */}
					<div className="mt-5 flex flex-wrap items-center gap-4">
						<StepBadge
							number={1}
							label="Select photo"
							active={currentStep === 1}
							done={step1Done}
						/>
						<div className="h-px w-6 bg-white/15" />
						<StepBadge
							number={2}
							label="Upload"
							active={currentStep === 2}
							done={step2Done}
						/>
						<div className="h-px w-6 bg-white/15" />
						<StepBadge
							number={3}
							label="Save to profile"
							active={currentStep === 3}
							done={step3Done}
						/>
					</div>
				</header>

				{/* ── Main card ───────────────────────────────────────────────────── */}
				<div className="grid gap-5 sm:grid-cols-2">
					{/* Left column: dropzone + URL input */}
					<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#100d1f]/70 p-5 backdrop-blur-sm">
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
								Step 1 — Select
							</h2>
							<p className="mt-1 text-xs text-slate-500">
								Pick a file to instantly preview it below.
							</p>
						</div>

						<FileDropzone
							onFileSelected={handleFileSelected}
							disabled={isUploading || isSaving || isLoadingProfile}
						/>

						{/* Manual URL field */}
						<div className="flex flex-col gap-1.5">
							<Label
								htmlFor="body-image-url"
								className="text-xs font-medium text-slate-400"
							>
								Or paste a public URL
							</Label>
							<Input
								id="body-image-url"
								value={uploadedUrl ?? savedBodyImageUrl}
								onChange={(e) => {
									const val = e.target.value;
									setUploadedUrl(val);
									setPendingFile(null);
									if (pendingPreviewUrl?.startsWith("blob:"))
										URL.revokeObjectURL(pendingPreviewUrl);
									setPendingPreviewUrl(null);
								}}
								placeholder="https://…"
								className="border-white/15 bg-white/[0.04] text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400/60 focus:ring-amber-400/20"
							/>
						</div>

						{/* Upload button */}
						<div className="border-t border-white/10 pt-3">
							<h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-400">
								Step 2 — Upload
							</h2>
							<Button
								onClick={() => void handleUpload()}
								disabled={!pendingFile || isUploading || isSaving}
								className="w-full bg-amber-500 font-semibold text-[#0a0714] hover:bg-amber-400 disabled:opacity-40"
							>
								{isUploading ? (
									<span className="flex items-center gap-2">
										<svg
											className="h-4 w-4 animate-spin"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v8z"
											/>
										</svg>
										Uploading…
									</span>
								) : (
									"Upload to Cloud"
								)}
							</Button>
						</div>

						{/* Save button */}
						<div className="border-t border-white/10 pt-3">
							<h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-400">
								Step 3 — Save
							</h2>
							<Button
								onClick={() => void handleSave()}
								disabled={!uploadedUrl || isSaving || isUploading}
								variant="outline"
								className="w-full border-emerald-500/40 bg-emerald-500/10 font-semibold text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/20 disabled:opacity-40"
							>
								{isSaving ? (
									<span className="flex items-center gap-2">
										<svg
											className="h-4 w-4 animate-spin"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v8z"
											/>
										</svg>
										Saving…
									</span>
								) : (
									"Save to Profile"
								)}
							</Button>
						</div>
					</div>

					{/* Right column: live preview */}
					<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#100d1f]/70 p-5 backdrop-blur-sm">
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
								Preview
							</h2>
							<p className="mt-1 text-xs text-slate-500">
								Appears here as soon as you select a file.
							</p>
						</div>

						{isLoadingProfile ? (
							<div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
								<svg
									className="h-6 w-6 animate-spin text-slate-500"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8v8z"
									/>
								</svg>
							</div>
						) : displayPreviewUrl ? (
							<div className="relative flex-1 overflow-hidden rounded-xl border border-white/10">
								<Image
									src={displayPreviewUrl}
									alt="Body preview"
									width={600}
									height={800}
									unoptimized={displayPreviewUrl.startsWith("blob:")}
									className="h-full min-h-64 w-full object-cover transition-opacity duration-300"
								/>
								{/* Status badge overlay */}
								{previewLabel && (
									<span
										className={`absolute bottom-3 left-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm ${previewBadgeColor}`}
									>
										{previewLabel}
									</span>
								)}
							</div>
						) : (
							<div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-8 w-8 text-slate-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 3h16.5A.75.75 0 0121 3.75v16.5A.75.75 0 0120.25 21H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z"
									/>
								</svg>
								<p className="text-xs text-slate-600">No image selected yet</p>
							</div>
						)}
					</div>
				</div>

				{/* ── Status / Error messages ─────────────────────────────────────── */}
				{statusMessage && (
					<div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 shrink-0"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
								clipRule="evenodd"
							/>
						</svg>
						{statusMessage}
					</div>
				)}
				{errorMessage && (
					<div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 shrink-0"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
								clipRule="evenodd"
							/>
						</svg>
						{errorMessage}
					</div>
				)}
			</section>
		</main>
	);
}