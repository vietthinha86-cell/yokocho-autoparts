import { createApp } from "./app.ts";

try {
  process.loadEnvFile?.();
} catch {
  // .env file is optional in dev & CI
}

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Akari Yokocho AutoParts API listening on http://localhost:${port}`);
});

