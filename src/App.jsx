import React, { useMemo, useState } from "react";

const DEV_UPSTREAM_API = "https://leetcode-api-faisalshohag.vercel.app";

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function calculatePercent(solved, total) {
  if (!total || total <= 0) return 0;
  return Math.round((solved / total) * 100);
}

function Circle({ label, percent, type }) {
  return (
    <article className={`circle ${type}`}>
      <span style={{ "--progress-degree": `${percent}%` }}>{percent}%</span>
      <p>{label}</p>
    </article>
  );
}

function StatCard({ value, label, tone = "default" }) {
  return (
    <article className={`card tone-${tone}`}>
      {value}
      <span>{label}</span>
    </article>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const progress = useMemo(() => {
    if (!data) {
      return { easy: 0, medium: 0, hard: 0 };
    }
    return {
      easy: calculatePercent(data.easySolved, data.totalEasy),
      medium: calculatePercent(data.mediumSolved, data.totalMedium),
      hard: calculatePercent(data.hardSolved, data.totalHard)
    };
  }, [data]);

  function getApiUrl(leetcodeUsername) {
    if (import.meta.env.DEV) {
      return `${DEV_UPSTREAM_API}/${encodeURIComponent(leetcodeUsername)}`;
    }
    return `/api/leetcode?username=${encodeURIComponent(leetcodeUsername)}`;
  }

  async function getJsonOrThrow(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        text.includes("<!doctype html") || text.includes("<html")
          ? "Local API route is unavailable in Vite dev. Use the updated app flow."
          : "Unexpected API response format."
      );
    }
    return response.json();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = username.trim();

    if (!trimmed) {
      setIsError(true);
      setStatus("Please enter a username.");
      setData(null);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setStatus("Fetching profile...");
    setData(null);

    try {
      const response = await fetch(getApiUrl(trimmed));
      const payload = await getJsonOrThrow(response);

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to fetch profile.");
      }

      const normalized = {
        easySolved: toNumber(payload.easySolved),
        mediumSolved: toNumber(payload.mediumSolved),
        hardSolved: toNumber(payload.hardSolved),
        totalEasy: toNumber(payload.totalEasy),
        totalMedium: toNumber(payload.totalMedium),
        totalHard: toNumber(payload.totalHard),
        totalSolved: toNumber(payload.totalSolved),
        ranking: payload.ranking ?? "N/A",
        contributionPoint: toNumber(payload.contributionPoint)
      };

      setData(normalized);
      setStatus(`Showing results for ${trimmed}.`);
    } catch (error) {
      setIsError(true);
      setStatus(error.message || "Unable to fetch data.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <h1 className="page-title">LeetMetric Dashboard</h1>

      <section className="dashboard container">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">LeetCode Analytics</p>
            <p className="subhead">Track solved counts, difficulty progress, and ranking in one place.</p>
          </div>
        </header>

        <form className="user-container" onSubmit={handleSubmit} noValidate>
          <label id="heading" htmlFor="user-input">
            Enter Your LeetCode Username
          </label>
          <div className="user-input-container">
            <input
              id="user-input"
              type="text"
              placeholder="e.g. suman_karmakar"
              autoComplete="off"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <button id="search-btn" type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          <p className={`status-msg ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {status}
          </p>
        </form>

        {data && (
          <>
            <section className="progress" aria-label="Difficulty progress circles">
              <Circle label="Easy" percent={progress.easy} type="easy-progress" />
              <Circle label="Medium" percent={progress.medium} type="medium-progress" />
              <Circle label="Hard" percent={progress.hard} type="hard-progress" />
            </section>

            <section className="metrics-grid" aria-label="LeetCode statistics cards">
              <StatCard value={`${data.easySolved}/${data.totalEasy}`} label="Easy Solved" tone="easy" />
              <StatCard value={data.mediumSolved} label="Medium Solved" tone="medium" />
              <StatCard value={data.hardSolved} label="Hard Solved" tone="hard" />
            </section>
          </>
        )}
      </section>

      {data && (
        <section className="external-summary container" aria-label="Overall profile stats">
          <StatCard value={data.totalSolved} label="Total Solved" tone="total" />
          <StatCard value={data.ranking} label="Ranking" tone="ranking" />
          <StatCard value={data.contributionPoint} label="Contribution" tone="contribution" />
        </section>
      )}
    </main>
  );
}
