import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aiAnalysis, firecrawlScrape } from "./server/routes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 4173);

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendResult(res, result) {
  res.writeHead(result.status, result.headers);
  if (result.stream) {
    result.stream.pipeTo(new WritableStream({ write(chunk) { res.write(Buffer.from(chunk)); }, close() { res.end(); } }));
    return;
  }
  res.end(result.body ?? "");
}

async function createHandler() {
  let vite;
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
  }

  return async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/api/firecrawl-scrape") {
        return sendResult(res, await firecrawlScrape(await readJson(req)));
      }
      if (req.method === "POST" && req.url === "/api/ai-analysis") {
        return sendResult(res, await aiAnalysis(await readJson(req)));
      }

      if (!isProd && vite) {
        return vite.middlewares(req, res, () => {});
      }

      const distPath = path.resolve(__dirname, "dist");
      const reqPath = req.url === "/" ? "/index.html" : req.url;
      const filePath = path.join(distPath, decodeURIComponent(reqPath));
      if (existsSync(filePath) && !filePath.endsWith("/")) {
        createReadStream(filePath).pipe(res);
        return;
      }

      const index = await readFile(path.join(distPath, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(index);
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }));
    }
  };
}

const handler = await createHandler();
createHttpServer(handler).listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
