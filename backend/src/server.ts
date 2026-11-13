import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Akari Yokocho AutoParts API listening on http://localhost:${port}`);
});

