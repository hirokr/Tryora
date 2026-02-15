export type Session = {
	user: {
		id: string;
		name: string;
		email: string;
		avatarUrl?: string;
		emailVerified: boolean;
		isActive: boolean;
	};
	accessToken: string;
	refreshToken: string;
};

export type FormState =
	| {
			error?: {
				name?: string[];
				email?: string[];
				password?: string[];
			};
			message?: string;
	  }
	| undefined;
