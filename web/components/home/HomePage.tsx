"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

import HeroSection from "@/components/home/HeroSection";
import BrandTicker from "@/components/home/BrandTicker";
import TryOnSection from "@/components/home/TryOnSection";
import WardrobeSection from "@/components/home/WardrobeSection";
import SceneSection from "@/components/home/SceneSection";
import BrandsSection from "@/components/home/BrandsSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";

const brands = ["VOGUE", "PRADA", "GUCCI", "NIKE", "Zara", "CHANEL", "ADIDAS"];

export default function HomePage() {
	const rootRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const heroTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });

			heroTimeline
				.from("[data-hero-title]", { opacity: 0, y: 28, duration: 0.9 })
				.from(
					"[data-hero-subtitle]",
					{ opacity: 0, y: 20, duration: 0.75 },
					"-=0.45",
				)
				.from(
					"[data-hero-actions]",
					{ opacity: 0, y: 16, duration: 0.7 },
					"-=0.4",
				)
				.from("[data-hero-badge]", { opacity: 0, duration: 0.6 }, "-=0.5")
				.from("[data-hero-image]", { opacity: 0, scale: 1.05, duration: 1 }, 0);

			gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
				gsap.from(element, {
					opacity: 0,
					y: 28,
					duration: 0.8,
					scrollTrigger: {
						trigger: element,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				});
			});

			gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((element) => {
				gsap.from(element.children, {
					opacity: 0,
					y: 20,
					duration: 0.6,
					stagger: 0.12,
					scrollTrigger: {
						trigger: element,
						start: "top 80%",
						toggleActions: "play none none reverse",
					},
				});
			});

			gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
				gsap.to(element, {
					y: -40,
					ease: "none",
					scrollTrigger: {
						trigger: element,
						start: "top bottom",
						end: "bottom top",
						scrub: true,
					},
				});
			});

			ScrollTrigger.refresh();
		},
		{ scope: rootRef },
	);

	return (
		<div className='relative flex min-h-screen w-full flex-col' ref={rootRef}>
			<HeroSection />
			<BrandTicker brands={brands} />
			<TryOnSection />
			<WardrobeSection />
			<SceneSection />
			<BrandsSection />
			<FinalCtaSection />
		</div>
	);
}
