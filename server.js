// ✅ deno.json を使っている場合の書き方
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v4.3.11/middleware.ts";

const app = new Hono();
const kv = await Deno.openKv();

// APIのルートを先に定義する
app.post("/api/register", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ msg: "未入力項目があります" }, 400);
  const existing = await kv.get(["users", username]);
  if (existing.value) return c.json({ msg: "その名前は使われています" }, 400);
  await kv.set(["users", username], { password });
  return c.json({ success: true });
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = await kv.get(["users", username]);
  if (user.value && user.value.password === password) {
    return c.json({ success: true });
  }
  return c.json({ msg: "IDまたはパスワードが違います" }, 401);
});

app.get("/api/items", async (c) => {
  const tag = c.req.query("tag");
  const items = [];
  for await (const res of kv.list({ prefix: ["items"] })) {
    if (!tag || (res.value.tags && res.value.tags.includes(tag))) {
      items.push(res.value);
    }
  }
  return c.json(items);
});

app.post("/api/items", async (c) => {
  const item = await c.req.json();
  const id = item.id || crypto.randomUUID();
  await kv.set(["items", id], { ...item, id });
  return c.json({ success: true });
});

app.delete("/api/items/:id", async (c) => {
  await kv.delete(["items", c.req.param("id")]);
  return c.json({ success: true });
});

app.get("/client.js", serveStatic({ path: "./public/client.js" }));
app.get("/", serveStatic({ path: "./public/index.html" }));

Deno.serve(app.fetch);