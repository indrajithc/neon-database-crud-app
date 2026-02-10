// routes.ts
import { sql, transaction, query } from "./db";

type Item = {
	id: number;
	name: string;
	value: number;
};

/* --------------------------------------------------
	 Helpers
-------------------------------------------------- */

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function badRequest(message: string) {
	return json({ error: message }, 400);
}

function notFound() {
	return json({ error: "Not found" }, 404);
}

function parseId(segments: string[]): number | null {
	if (segments.length < 3) return null;

	const id = Number(segments[2]);
	return Number.isInteger(id) ? id : null;
}

async function parseBody(req: Request) {
	try {
		return await req.json();
	} catch {
		return null;
	}
}

function validateItem(body: any) {
	if (!body) return "Body required";
	if (typeof body.name !== "string" || body.name.trim() === "")
		return "name must be string";
	if (typeof body.value !== "number") return "value must be number";
	return null;
}

/* --------------------------------------------------
	 Main handler
-------------------------------------------------- */

export async function handleApi(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const segments = url.pathname.split("/").filter(Boolean);
	// ["api","items","5"]

	const id = parseId(segments);

	/* -----------------------------
		 GET /api/items
		 ----------------------------- */
	if (req.method === "GET" && segments.length === 2) {
		const { data, error } = await query<Item[]>(
			() => sql`SELECT * FROM playing_with_neon ORDER BY id`,
			"LIST_ITEMS"
		);

		if (error) return json({ error: error.message }, 500);
		return json(data);
	}

	/* -----------------------------
		 POST /api/items
		 ----------------------------- */
	if (req.method === "POST" && segments.length === 2) {
		const body = await parseBody(req);
		const validation = validateItem(body);
		if (validation) return badRequest(validation);

		const { data, error } = await query<Item>(
			() =>
				transaction(async (tx) => {
					const [row] = await tx<Item[]>`
            INSERT INTO playing_with_neon (name, value)
            VALUES (${body.name}, ${body.value})
            RETURNING *
          `;
					return row;
				}),
			"CREATE_ITEM"
		);

		if (error) return json({ error: error.message }, 500);
		return json(data, 201);
	}

	/* -----------------------------
		 PUT /api/items/:id
		 ----------------------------- */
	if (req.method === "PUT" && id !== null) {
		const body = await parseBody(req);
		const validation = validateItem(body);
		if (validation) return badRequest(validation);

		const { data, error } = await query<Item | undefined>(
			() =>
				transaction(async (tx) => {
					const [row] = await tx<Item[]>`
            UPDATE playing_with_neon
            SET name=${body.name}, value=${body.value}
            WHERE id=${id}
            RETURNING *
          `;
					return row;
				}),
			"UPDATE_ITEM"
		);

		if (error) return json({ error: error.message }, 500);
		if (!data) return notFound();

		return json(data);
	}

	/* -----------------------------
		 DELETE /api/items/:id
		 ----------------------------- */
	if (req.method === "DELETE" && id !== null) {
		const { error } = await query(
			() =>
				transaction(async (tx) => {
					await tx`
            DELETE FROM playing_with_neon
            WHERE id=${id}
          `;
				}),
			"DELETE_ITEM"
		);

		if (error) return json({ error: error.message }, 500);

		return new Response(null, { status: 204 });
	}

	return notFound();
}
