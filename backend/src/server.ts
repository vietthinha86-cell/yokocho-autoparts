import { createApp } from "./app.ts";
import { loadProjectEnv } from "./envLoader.ts";

// Load backend/.env and override stale OS environment variables
loadProjectEnv(true);

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Akari Yokocho AutoParts API listening on http://localhost:${port}`);
  const ollamaUrl = (
    process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "qwen2.5:3b";
  if (process.env.AI_PROVIDER?.trim().toLowerCase() !== "local") {
    void fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: ollamaModel, prompt: "", keep_alive: "30m" }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => undefined);
  }
});
