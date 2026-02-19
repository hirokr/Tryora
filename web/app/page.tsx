import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";

export default function Home() {
	return (
		<main>
			<h1 className='text-2xl font-bold'>Home Page</h1>
			<div className='h-20'></div>
			<Button>
				<Loader />
				Loading ...
			</Button>
		</main>
	);
}
