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
      <span style={{ "--progress-degree": `${percent}%` }}>
        <strong>{percent}%</strong>
      </span>
      <p>{label}</p>
    </article>
  );
}

function StatCard({ value, label, tone = "default", detail }) {
  return (
    <article className={`card tone-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
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

  const solvedBreakdown = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: "easy",
        label: "Easy",
        solved: data.easySolved,
        total: data.totalEasy,
        percent: progress.easy,
        tone: "easy"
      },
      {
        key: "medium",
        label: "Medium",
        solved: data.mediumSolved,
        total: data.totalMedium,
        percent: progress.medium,
        tone: "medium"
      },
      {
        key: "hard",
        label: "Hard",
        solved: data.hardSolved,
        total: data.totalHard,
        percent: progress.hard,
        tone: "hard"
      }
    ];
  }, [data, progress]);

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
      <div className="animated-bg" aria-hidden="true">
        <span className="beam beam-one" />
        <span className="beam beam-two" />
        <span className="code-rain rain-one">while solve rank++</span>
        <span className="code-rain rain-two">O(log n)</span>
        <span className="code-rain rain-three">accepted</span>
      </div>

      <header className="hero container">
        <p className="eyebrow">LeetCode Analytics</p>
        <h1 className="page-title">LeetMetric Dashboard</h1>
        <p className="hero-copy">A sharp animated command center for solved counts, difficulty progress, rank, and contribution points.</p>
      </header>

      <section className="dashboard container">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Profile Lookup</p>
            <p className="subhead">Enter a username and watch the dashboard light up with live LeetCode metrics.</p>
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
              <span>{isLoading ? "Searching..." : "Search"}</span>
            </button>
          </div>
          <p className={`status-msg ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {status}
          </p>
        </form>

        {isLoading && (
          <section className="loading-panel" aria-label="Loading profile">
            <span />
            <p>Compiling profile metrics...</p>
          </section>
        )}

        {data && (
          <section className="results-shell">
            <section className="profile-summary" aria-label="Overall profile stats">
              <div>
                <p className="eyebrow">Profile Ready</p>
                <h2>{data.totalSolved} problems solved</h2>
              </div>
              <div className="rank-chip">
                <span>Rank</span>
                <strong>{data.ranking}</strong>
              </div>
            </section>

            <section className="progress" aria-label="Difficulty progress circles">
              {solvedBreakdown.map((item) => (
                <article className={`difficulty-card tone-${item.tone}`} key={item.key}>
                  <Circle label={item.label} percent={item.percent} type={`${item.tone}-progress`} />
                  <div className="difficulty-meta">
                    <strong>
                      {item.solved}/{item.total}
                    </strong>
                    <span>Solved</span>
                  </div>
                  <div className="progress-line" style={{ "--line-progress": `${item.percent}%` }} />
                </article>
              ))}
            </section>

            <section className="metrics-grid" aria-label="LeetCode statistics cards">
              <StatCard value={data.totalSolved} label="Total Solved" tone="total" detail="All difficulties" />
              <StatCard value={data.ranking} label="Global Ranking" tone="ranking" detail="LeetCode position" />
              <StatCard value={data.contributionPoint} label="Contribution" tone="contribution" detail="Community points" />
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
