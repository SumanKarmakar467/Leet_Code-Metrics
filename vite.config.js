import { defineConfig } from "vite";
import leetcodeHandler from "./api/leetcode.js";

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [
    {
      name: "leetcode-dev-api",
      configureServer(server) {
        // Mirrors the Vercel serverless route so dev and deployed behavior match.
        server.middlewares.use("/api/leetcode", async (req, res) => {
          const requestUrl = new URL(req.url || "", "http://localhost");

          req.query = { username: requestUrl.searchParams.get("username") || "" };
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (payload) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(payload));
            return res;
          };

          try {
            await leetcodeHandler(req, res);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Unable to fetch data." }));
          }
        });
      }
    }
  ]
});
