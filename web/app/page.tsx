"use client";

import { useAuth } from "@/context/auth.context";

export default function Home() {
	const { user, isLoading } = useAuth();

	return (
		<main className='flex-1'>
			{isLoading ? (
				<p>Checking user session...</p>
			) : user ? (
				<section className='space-y-3'>
					<p>Welcome back, {user.name}!</p>
					<div>
						<p>User data:</p>
						<pre>{JSON.stringify(user, null, 2)}</pre>
					</div>
				</section>
			) : (
				<p>Welcome to Tryora! Please sign in to explore our features.</p>
			)}
		</main>
	);
}
