"use client";

import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";

type AvatarStudioModelViewerProps = {
	modelUrl: string;
	size?: "default" | "large";
};

function Model({ modelUrl, scale }: { modelUrl: string; scale: number }) {
	const gltf = useGLTF(modelUrl);

	useEffect(() => {
		return () => {
			gltf.scene.traverse((child) => {
				if ("geometry" in child && child.geometry) {
					child.geometry.dispose();
				}

				if ("material" in child && child.material) {
					if (Array.isArray(child.material)) {
						child.material.forEach((material) => material.dispose());
					} else {
						child.material.dispose();
					}
				}
			});
		};
	}, [gltf]);

	return (
		<Center>
			<primitive object={gltf.scene} scale={scale} />
		</Center>
	);
}

function LoadingState({ minHeightClass }: { minHeightClass: string }) {
	return (
		<div
			className={`flex h-full w-full items-center justify-center rounded-4xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(140,43,238,0.2),transparent_55%),linear-gradient(180deg,rgba(10,10,20,0.92),rgba(8,8,16,0.96))] p-8 text-center text-sm text-slate-300 ${minHeightClass}`}
		>
			<div className='max-w-sm space-y-3'>
				<div className='mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200' />
				<p className='text-base font-medium text-white'>Loading 3D model</p>
				<p>Preparing the generated avatar preview in the studio viewport.</p>
			</div>
		</div>
	);
}

export function AvatarStudioModelViewer({
	modelUrl,
	size = "default",
}: AvatarStudioModelViewerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isVisible, setIsVisible] = useState(true);
	const isLarge = size === "large";
	const canvasHeightClass = isLarge
		? "h-[40rem] md:h-[52rem]"
		: "h-[32rem] md:h-[40rem]";
	const minHeightClass = isLarge ? "min-h-[40rem]" : "min-h-[32rem]";
	const modelScale = isLarge ? 2.1 : 1.6;

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const container = containerRef.current;
		if (!container) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(entry.isIntersecting);
			},
			{ rootMargin: "200px 0px", threshold: 0.1 },
		);

		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div className='overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,12,24,0.98),rgba(8,8,16,0.98))] shadow-[0_24px_90px_rgba(0,0,0,0.35)]'>
			<div className='border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.22em] text-slate-400'>
				3D Preview
			</div>
			<div ref={containerRef} className={`relative w-full ${minHeightClass}`}>
				{isVisible ? (
					<Suspense fallback={<LoadingState minHeightClass={minHeightClass} />}>
						<Canvas
							camera={{ position: [0, 0.8, 3.4], fov: 42 }}
							className={`${canvasHeightClass} w-full`}
							gl={{
								antialias: true,
								alpha: true,
								powerPreference: "high-performance",
							}}
							dpr={[1, 1.25]}
						>
							<color attach='background' args={["#090810"]} />
							<ambientLight intensity={1.3} />
							<directionalLight
								position={[4, 6, 5]}
								intensity={2.5}
								color='#f6d5ff'
							/>
							<pointLight
								position={[-4, -2, 4]}
								intensity={18}
								color='#7dd3fc'
							/>
							<Model modelUrl={modelUrl} scale={modelScale} />
							<Environment preset='city' />
							<OrbitControls
								enablePan={false}
								minDistance={1.8}
								maxDistance={7}
								autoRotate
								autoRotateSpeed={0.45}
							/>
						</Canvas>
					</Suspense>
				) : (
					<LoadingState minHeightClass={minHeightClass} />
				)}
			</div>
		</div>
	);
}
