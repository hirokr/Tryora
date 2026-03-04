// prisma.config.js
export default {
	schema: "prisma/schema.prisma",
	datasource: {
		url: process.env.DATABASE_URL, // It will read from your FastAPI .env file
	},
};
