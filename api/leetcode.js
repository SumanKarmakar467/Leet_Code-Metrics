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

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const username = String(req.query?.username || "").trim();
  if (!username) {
    return res.status(400).json({ message: "username query param is required" });
  }

  try {
    const [response, badgeData] = await Promise.all([
      fetch(`${UPSTREAM_API}/${encodeURIComponent(username)}`),
      fetchLeetCodeBadges(username)
    ]);

    if (!response.ok) {
      return res.status(response.status).json({ message: "Failed to fetch profile." });
    }

    const raw = await response.json();
    const payload = {
      easySolved: toNumber(raw?.easySolved),
      mediumSolved: toNumber(raw?.mediumSolved),
      hardSolved: toNumber(raw?.hardSolved),
      totalEasy: toNumber(raw?.totalEasy ?? raw?.easyTotal ?? raw?.easyQuestions),
      totalMedium: toNumber(raw?.totalMedium ?? raw?.mediumTotal ?? raw?.mediumQuestions),
      totalHard: toNumber(raw?.totalHard ?? raw?.hardTotal ?? raw?.hardQuestions),
      totalSolved: toNumber(
        raw?.totalSolved ??
          (toNumber(raw?.easySolved) + toNumber(raw?.mediumSolved) + toNumber(raw?.hardSolved))
      ),
      ranking: raw?.ranking ?? "N/A",
      contributionPoint: toNumber(raw?.contributionPoint ?? raw?.contributionPoints ?? raw?.contribution),
      reputation: toNumber(raw?.reputation),
      totalSubmissions: raw?.totalSubmissions || [],
      matchedUserStats: raw?.matchedUserStats || null,
      recentSubmissions: raw?.recentSubmissions || [],
      submissionCalendar: raw?.submissionCalendar || {},
      badges: badgeData.badges,
      activeBadge: badgeData.activeBadge
    };

    const hasAnyProgressData =
      payload.totalSolved > 0 ||
      payload.easySolved > 0 ||
      payload.mediumSolved > 0 ||
      payload.hardSolved > 0 ||
      payload.totalEasy > 0 ||
      payload.totalMedium > 0 ||
      payload.totalHard > 0;

    if (!hasAnyProgressData) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(payload);
  } catch {
    return res.status(500).json({ message: "Unable to fetch data." });
  }
}
