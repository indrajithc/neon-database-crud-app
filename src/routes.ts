// routes.ts
import { sql } from "./db";

export async function handleApi(req: Request) {
	const url = new URL(req.url);
	const segments = url.pathname.split("/").filter(Boolean);
	// ["api","items","3"]

	const id = segments[2] ? Number(segments[2]) : null;

	try {
		// -------------------------
		// LIST
		// GET /api/items
		// -------------------------
		if (req.method === "GET" && segments.length === 2) {
			const rows = await sql`
        SELECT * FROM playing_with_neon ORDER BY id
      `;
			return Response.json(rows);
		}

		// -------------------------
		// CREATE
		// POST /api/items
		// -------------------------
		if (req.method === "POST" && segments.length === 2) {
			const body = await req.json();

			const [row] = await sql`
        INSERT INTO playing_with_neon (name, value)
        VALUES (${body.name}, ${body.value})
        RETURNING *
      `;

			return Response.json(row);
		}

		// -------------------------
		// UPDATE
		// PUT /api/items/:id
		// -------------------------
		if (req.method === "PUT" && id !== null) {
			const body = await req.json();

			const [row] = await sql`
        UPDATE playing_with_neon
        SET name=${body.name}, value=${body.value}
        WHERE id=${id}
        RETURNING *
      `;

			return Response.json(row);
		}

		// -------------------------
		// DELETE
		// DELETE /api/items/:id
		// -------------------------
		if (req.method === "DELETE" && id !== null) {
			await sql`
        DELETE FROM playing_with_neon
        WHERE id=${id}
      `;

			return new Response(null, { status: 204 });
		}

		return new Response("Not Found", { status: 404 });
	} catch (err) {
		console.error(err);
		return Response.json({ error: "Server error" }, { status: 500 });
	}
}
