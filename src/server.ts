// server.ts
import { serve } from "bun";
import { handleApi } from "./routes";
import "dotenv/config";

const port = Number(process.env.PORT || 3000);

serve({
	port,

	async fetch(req) {
		const url = new URL(req.url);

		// API routes
		if (url.pathname.startsWith("/api/")) {
			return handleApi(req);
		}

		// Static files
		if (url.pathname === "/") {
			return new Response(await Bun.file("./public/index.html").text(), {
				headers: { "Content-Type": "text/html" },
			});
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log(`🚀 http://localhost:${port}`);
