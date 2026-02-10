// import 'dotenv/config';
// import './server.ts';


import express from "express";

const app = express();

app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

app.listen(8000, () => {
	console.log("API server is running on http://localhost:8000");
});

