// routes.ts
import { sql } from "./db";

export async function handleApi(req: Request) {
	const url = new URL(req.url);
	const id = url.pathname.split("/")[2];

	try {
		// LIST
		if (req.method === "GET" && url.pathname === "/api/items") {
			const rows = await sql`SELECT * FROM playing_with_neon ORDER BY id`;
			return Response.json(rows);
		}

		// CREATE
		if (req.method === "POST" && url.pathname === "/api/items") {
			const body = await req.json();

			const [row] = await sql`
        INSERT INTO playing_with_neon (name, value)
        VALUES (${body.name}, ${body.value})
        RETURNING *
      `;

			return Response.json(row);
		}

		// UPDATE
		if (req.method === "PUT" && id) {
			const body = await req.json();

			const [row] = await sql`
        UPDATE playing_with_neon
        SET name=${body.name}, value=${body.value}
        WHERE id=${id}
        RETURNING *
      `;

			return Response.json(row);
		}

		// DELETE
		if (req.method === "DELETE" && id) {
			await sql`DELETE FROM playing_with_neon WHERE id=${id}`;
			return new Response(null, { status: 204 });
		}

		return new Response("Not Found", { status: 404 });
	} catch (err) {
		console.error(err);
		return Response.json({ error: "Server error" }, { status: 500 });
	}
}
