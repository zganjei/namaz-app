import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { prayerBackups } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "ورود لازم است" }, { status: 401 });

  const [row] = await getDb()
    .select()
    .from(prayerBackups)
    .where(eq(prayerBackups.userId, user.userId))
    .limit(1);

  return Response.json({
    email: user.email,
    backup: row
      ? { data: JSON.parse(row.payload), updatedAt: row.updatedAt }
      : null,
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "ورود لازم است" }, { status: 401 });

  const body = (await request.json()) as { data?: unknown };
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return Response.json({ error: "اطلاعات بکاپ معتبر نیست" }, { status: 400 });
  }

  const payload = JSON.stringify(body.data);
  if (payload.length > 250_000) {
    return Response.json({ error: "حجم بکاپ بیش از حد مجاز است" }, { status: 413 });
  }

  const updatedAt = new Date().toISOString();
  await getDb()
    .insert(prayerBackups)
    .values({ userId: user.userId, email: user.email, payload, updatedAt })
    .onConflictDoUpdate({
      target: prayerBackups.userId,
      set: { email: user.email, payload, updatedAt },
    });

  return Response.json({ ok: true, email: user.email, updatedAt });
}
