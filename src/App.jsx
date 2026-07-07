import React, { useMemo, useState } from "react";

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function calculatePercent(solved, total) {
  if (!total || total <= 0) return 0;
  return Math.round((solved / total) * 100);
}

function dayKeyFromTimestamp(timestamp) {
  const date = new Date(toNumber(timestamp) * 1000);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getCalendarStats(calendar = {}) {
  const activeDays = Object.keys(calendar)
    .filter((timestamp) => toNumber(calendar[timestamp]) > 0)
    .map(dayKeyFromTimestamp)
    .filter(Number.isFinite)
    .sort((first, second) => first - second);

  if (!activeDays.length) {
    return {
      activeDays: 0,
      latestStreak: 0,
      longestStreak: 0,
      latestActiveDate: "N/A",
      totalCalendarSubmissions: 0
    };
  }

  let longestStreak = 1;
  let currentRun = 1;

  for (let index = 1; index < activeDays.length; index += 1) {
    const gap = Math.round((activeDays[index] - activeDays[index - 1]) / 86400000);
    currentRun = gap === 1 ? currentRun + 1 : 1;
    longestStreak = Math.max(longestStreak, currentRun);
  }

  const latestActiveDate = new Date(activeDays[activeDays.length - 1]).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return {
    activeDays: activeDays.length,
    latestStreak: currentRun,
    longestStreak,
    latestActiveDate,
    totalCalendarSubmissions: Object.values(calendar).reduce((sum, count) => sum + toNumber(count), 0)
  };
}

function getSubmissionCount(submissions = [], difficulty = "All") {
  return toNumber(submissions.find((item) => item.difficulty === difficulty)?.submissions);
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

function AchievementCard({ value, label, detail, tone = "default" }) {
  return (
    <article className={`achievement tone-${tone}`}>
      <div className="achievement-mark" aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
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

  const achievements = useMemo(() => {
    if (!data) return [];

    const streakTone = data.latestStreak >= 50 ? "streak" : "ranking";
    const streakDetail =
      data.latestStreak >= 50
        ? "50 day streak unlocked"
        : `Best streak ${data.longestStreak} days`;

    return [
      {
        value: `${data.badges.length}`,
        label: "LeetCode Badges",
        detail: data.activeBadge ? `Active: ${data.activeBadge.displayName}` : "Profile achievements",
        tone: "streak"
      },
      {
        value: `${data.latestStreak}`,
        label: "Day Streak",
        detail: streakDetail,
        tone: streakTone
      },
      {
        value: `${data.longestStreak}`,
        label: "Longest Streak",
        detail: `Latest active ${data.latestActiveDate}`,
        tone: "streak"
      },
      {
        value: `${data.activeDays}`,
        label: "Active Days",
        detail: `${data.totalCalendarSubmissions} calendar submissions`,
        tone: "contribution"
      },
      {
        value: `${data.acceptanceRate}%`,
        label: "Acceptance",
        detail: `${data.acceptedSubmissions}/${data.totalSubmissions} accepted`,
        tone: "easy"
      },
      {
        value: `${data.recentAccepted}`,
        label: "Recent Accepted",
        detail: "From latest submissions",
        tone: "medium"
      },
      {
        value: `${data.reputation}`,
        label: "Reputation",
        detail: "Profile reputation",
        tone: "hard"
      }
    ];
  }, [data]);

  function getApiUrl(leetcodeUsername) {
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
        username: trimmed,
        easySolved: toNumber(payload.easySolved),
        mediumSolved: toNumber(payload.mediumSolved),
        hardSolved: toNumber(payload.hardSolved),
        totalEasy: toNumber(payload.totalEasy),
        totalMedium: toNumber(payload.totalMedium),
        totalHard: toNumber(payload.totalHard),
        totalSolved: toNumber(payload.totalSolved),
        ranking: payload.ranking ?? "N/A",
        contributionPoint: toNumber(payload.contributionPoint),
        reputation: toNumber(payload.reputation),
        totalSubmissions: getSubmissionCount(payload.totalSubmissions),
        acceptedSubmissions: getSubmissionCount(payload.matchedUserStats?.acSubmissionNum),
        recentAccepted: Array.isArray(payload.recentSubmissions)
          ? payload.recentSubmissions.filter((submission) => submission.statusDisplay === "Accepted").length
          : 0,
        badges: Array.isArray(payload.badges) ? payload.badges : [],
        activeBadge: payload.activeBadge || null,
        ...getCalendarStats(payload.submissionCalendar)
      };

      normalized.acceptanceRate = calculatePercent(normalized.acceptedSubmissions, normalized.totalSubmissions);

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
        <span className="code-rain rain-one">two pointers</span>
        <span className="code-rain rain-two">dp[i] = max()</span>
        <span className="code-rain rain-three">binary search</span>
        <span className="algo-pill pill-one">HashMap</span>
        <span className="algo-pill pill-two">Stack</span>
        <span className="algo-pill pill-three">Graph BFS</span>
        <article className="floating-question question-one">
          <span>Easy</span>
          <strong>Two Sum</strong>
          <small>HashMap · O(n)</small>
        </article>
        <article className="floating-question question-two">
          <span>Medium</span>
          <strong>Longest Substring</strong>
          <small>Sliding Window</small>
        </article>
        <article className="floating-question question-three">
          <span>Hard</span>
          <strong>Merge K Lists</strong>
          <small>Heap · Linked List</small>
        </article>
        <article className="floating-question question-four">
          <span>Medium</span>
          <strong>Course Schedule</strong>
          <small>Graph · BFS</small>
        </article>
        <article className="floating-question question-five">
          <span>Easy</span>
          <strong>Valid Parentheses</strong>
          <small>Stack</small>
        </article>
        <article className="answer-snippet snippet-java">
          <span>Java</span>
          <code>
            {`Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
  int need = target - nums[i];
  if (seen.containsKey(need)) return new int[]{seen.get(need), i};
  seen.put(nums[i], i);
}`}
          </code>
        </article>
        <article className="answer-snippet snippet-cpp">
          <span>C++</span>
          <code>
            {`unordered_map<int, int> seen;
for (int i = 0; i < nums.size(); i++) {
  int need = target - nums[i];
  if (seen.count(need)) return {seen[need], i};
  seen[nums[i]] = i;
}`}
          </code>
        </article>
        <div className="dsa-orbit orbit-one">
          <span />
          <span />
          <span />
        </div>
        <div className="linked-list-path">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="stack-bars">
          <span />
          <span />
          <span />
          <span />
        </div>
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
                <h2>{data.username} solved {data.totalSolved} problems</h2>
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

            <section className="achievements-panel" aria-label="LeetCode achievements">
              <div className="section-heading">
                <p className="eyebrow">Achievements</p>
                <h3>Streaks, consistency, and profile wins</h3>
              </div>
              {data.badges.length > 0 && (
                <div className="badge-rack" aria-label="LeetCode badges">
                  {data.badges.map((badge) => (
                    <article className="badge-card" key={badge.id || badge.displayName}>
                      {badge.icon && <img src={badge.icon} alt="" loading="lazy" />}
                      <div>
                        <strong>{badge.displayName}</strong>
                        <span>{badge.creationDate ? `Earned ${badge.creationDate}` : "LeetCode badge"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.label}
                    value={achievement.value}
                    label={achievement.label}
                    detail={achievement.detail}
                    tone={achievement.tone}
                  />
                ))}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
