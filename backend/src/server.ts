import { warmUpOllamaChatModel } from "./ai/akariAdvisor.ts";
import { createApp } from "./app.ts";
import { loadProjectEnv } from "./envLoader.ts";

// Load backend/.env and override stale OS environment variables
loadProjectEnv(true);

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Akari Yokocho AutoParts API listening on http://localhost:${port}`);
  void warmUpOllamaChatModel();
});
