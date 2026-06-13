const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = path.resolve(process.argv[2] || "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

http
  .createServer(async (request, response) => {
    const startedAt = Date.now();
    const url = new URL(request.url, `http://${host}`);
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.join(root, requestedPath);

    response.on("finish", () => {
      console.log(`[static-server] ${request.method} ${requestedPath} -> ${response.statusCode} ${Date.now() - startedAt}ms`);
    });

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`Serving ${root} at http://${host}:${port}`);
  });
