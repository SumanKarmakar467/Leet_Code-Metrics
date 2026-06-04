import { defineConfig } from "vite";

const UPSTREAM_API = "https://leetcode-api-faisalshohag.vercel.app";
const LEETCODE_GRAPHQL_API = "https://leetcode.com/graphql";

const BADGES_QUERY = `
  query userBadges($username: String!) {
    matchedUser(username: $username) {
      badges {
        id
        displayName
        icon
        creationDate
      }
      activeBadge {
        id
        displayName
        icon
      }
    }
  }
`;

async function fetchLeetCodeBadges(username) {
  try {
    const response = await fetch(LEETCODE_GRAPHQL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: BADGES_QUERY, variables: { username } })
    });

    if (!response.ok) {
      return { badges: [], activeBadge: null };
    }

    const payload = await response.json();
    const user = payload?.data?.matchedUser;

    return {
      badges: Array.isArray(user?.badges) ? user.badges : [],
      activeBadge: user?.activeBadge || null
    };
  } catch {
    return { badges: [], activeBadge: null };
  }
}

async function getLeetCodeProfile(username) {
  const [response, badgeData] = await Promise.all([
    fetch(`${UPSTREAM_API}/${encodeURIComponent(username)}`),
    fetchLeetCodeBadges(username)
  ]);

  if (!response.ok) {
    return {
      status: response.status,
      payload: { message: "Failed to fetch profile." }
    };
  }

  const payload = await response.json();

  return {
    status: 200,
    payload: {
      ...payload,
      badges: badgeData.badges,
      activeBadge: badgeData.activeBadge
    }
  };
}

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [
    {
      name: "leetcode-dev-api",
      configureServer(server) {
        server.middlewares.use("/api/leetcode", async (req, res) => {
          const requestUrl = new URL(req.url || "", "http://localhost");
          const username = String(requestUrl.searchParams.get("username") || "").trim();

          res.setHeader("Content-Type", "application/json");

          if (!username) {
            res.statusCode = 400;
            res.end(JSON.stringify({ message: "username query param is required" }));
            return;
          }

          try {
            const result = await getLeetCodeProfile(username);
            res.statusCode = result.status;
            res.end(JSON.stringify(result.payload));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Unable to fetch data." }));
          }
        });
      }
    }
  ]
});
