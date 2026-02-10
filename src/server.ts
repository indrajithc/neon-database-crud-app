// server.ts

const server = Bun.serve({
	port: 3000,

	async fetch(req: Request) {
		const url = new URL(req.url);
		const { pathname } = url;

		// Route: /
		if (pathname === "/") {
			return new Response("Hello World from Bun 🚀", {
				headers: { "Content-Type": "text/plain" },
			});
		}

		// Route: /json
		if (pathname === "/json") {
			return Response.json({
				message: "Hello JSON",
				runtime: "Bun",
				time: new Date().toISOString(),
			});
		}

		// Route: /hello/:name
		if (pathname.startsWith("/hello/")) {
			const name = pathname.split("/")[2];
			return new Response(`Hello ${name}! 👋`);
		}

		// Route: POST /echo
		if (pathname === "/echo" && req.method === "POST") {
			const body = await req.text();
			return new Response(`You sent: ${body}`);
		}

		// 404
		return new Response("Not Found", { status: 404 });
	},
});

console.log(`🚀 Bun server running at http://localhost:${server.port}`);
