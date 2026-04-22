import { authFetch } from "@/lib/auth/authFetch";
import { useEffect, useState } from "react";

const TryonModel = () => {
	const [tryons, setTryons] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const getUserTryOns = async () => {
			setIsLoading(true);
			setError(null);

			const response = await authFetch("/api/tryon/user/{userId}:");

			if (response.ok) {
				const tryonData = await response.json();
				setTryons(tryonData);
			} else {
				setError("Failed to fetch try-ons");
			}
			setIsLoading(false);
		};
		return () => void getUserTryOns();
	}, []);

	return <div>page</div>;
};

export default TryonModel;
