const elements = {
    form: document.getElementById("search-form"),
    input: document.getElementById("user-input"),
    searchBtn: document.getElementById("search-btn"),
    statusMsg: document.getElementById("status-msg"),
    progressSection: document.querySelector(".progress"),
    metricsGrid: document.querySelector(".metrics-grid"),
    externalSummary: document.querySelector(".external-summary"),
    progrss: {
        easy: document.querySelector(".easy-progress"),
        medium: document.querySelector(".medium-progress"),
        hard: document.querySelector(".hard-progress")
    },
    labels: {
        easy: document.getElementById("easy-label"),
        medium: document.getElementById("medium-label"),
        hard: document.getElementById("hard-label")
    },
    metricCards: {
        easy: document.getElementById("easy-card"),
        medium: document.getElementById("medium-card"),
        hard: document.getElementById("hard-card"),
        total: document.getElementById("total-card"),
        ranking: document.getElementById("ranking-card"),
        contribution: document.getElementById("contribution-card")
    }
};

const API_BASE = "https://leetcode-api-faisalshohag.vercel.app";
let activeUsername = "";

function toNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function setStatus(message, isError = false) {
    elements.statusMsg.textContent = message;
    elements.statusMsg.style.color = isError ? "#dc2626" : "var(--muted)";
}

function setLoading(isLoading) {
    elements.searchBtn.disabled = isLoading;
    elements.searchBtn.textContent = isLoading ? "Searching..." : "Search";
}

function setResultsVisible(isVisible) {
    if (elements.progressSection) {
        elements.progressSection.hidden = !isVisible;
        elements.progressSection.style.display = isVisible ? "grid" : "none";
        elements.progressSection.setAttribute("aria-hidden", String(!isVisible));
    }
    if (elements.metricsGrid) {
        elements.metricsGrid.hidden = !isVisible;
        elements.metricsGrid.style.display = isVisible ? "grid" : "none";
        elements.metricsGrid.setAttribute("aria-hidden", String(!isVisible));
    }
    if (elements.externalSummary) {
        elements.externalSummary.hidden = !isVisible;
        elements.externalSummary.style.display = isVisible ? "grid" : "none";
        elements.externalSummary.setAttribute("aria-hidden", String(!isVisible));
    }
}

function resetResults() {
    setResultsVisible(false);
    activeUsername = "";
    elements.labels.easy.textContent = "0%";
    elements.labels.medium.textContent = "0%";
    elements.labels.hard.textContent = "0%";
    elements.progress.easy.style.setProperty("--progress-degree", "0%");
    elements.progress.medium.style.setProperty("--progress-degree", "0%");
    elements.progress.hard.style.setProperty("--progress-degree", "0%");
    elements.metricCards.easy.innerHTML = "0/0<span>Easy Solved</span>";
    elements.metricCards.medium.innerHTML = "0<span>Medium Solved</span>";
    elements.metricCards.hard.innerHTML = "0<span>Hard Solved</span>";
    elements.metricCards.total.innerHTML = "0<span>Total Solved</span>";
    elements.metricCards.ranking.innerHTML = "0<span>Ranking</span>";
    elements.metricCards.contribution.innerHTML = "0<span>Contribution</span>";
}

function calculatePercent(solved, total) {
    if (!total || total <= 0) return 0;
    return Math.round((solved / total) * 100);
}

function updateProgress(data) {
    const values = {
        easy: calculatePercent(data.easySolved, data.totalEasy),
        medium: calculatePercent(data.mediumSolved, data.totalMedium),
        hard: calculatePercent(data.hardSolved, data.totalHard)
    };

    elements.progress.easy.style.setProperty("--progress-degree", `${values.easy}%`);
    elements.progress.medium.style.setProperty("--progress-degree", `${values.medium}%`);
    elements.progress.hard.style.setProperty("--progress-degree", `${values.hard}%`);

    elements.labels.easy.textContent = `${values.easy}%`;
    elements.labels.medium.textContent = `${values.medium}%`;
    elements.labels.hard.textContent = `${values.hard}%`;

    elements.metricCards.easy.innerHTML = `${data.easySolved ?? 0}/${data.totalEasy ?? 0}<span>Easy Solved</span>`;
    elements.metricCards.medium.innerHTML = `${data.mediumSolved ?? 0}<span>Medium Solved</span>`;
    elements.metricCards.hard.innerHTML = `${data.hardSolved ?? 0}<span>Hard Solved</span>`;
    elements.metricCards.total.innerHTML = `${data.totalSolved ?? 0}<span>Total Solved</span>`;
    elements.metricCards.ranking.innerHTML = `${data.ranking ?? "N/A"}<span>Ranking</span>`;
    elements.metricCards.contribution.innerHTML = `${data.contributionPoint ?? 0}<span>Contribution</span>`;
}

function enableDarkThemeOnly() {
    document.body.classList.add("dark");
}

async function fetchLeetCodeData(username) {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(username)}`);
    if (!response.ok) {
        throw new Error("Failed to fetch profile.");
    }

    const raw = await response.json();
    const data = {
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
        contributionPoint: toNumber(raw?.contributionPoint ?? raw?.contributionPoints ?? raw?.contribution)
    };

    const hasAnyProgressData =
        data.totalSolved > 0 ||
        data.easySolved > 0 ||
        data.mediumSolved > 0 ||
        data.hardSolved > 0 ||
        data.totalEasy > 0 ||
        data.totalMedium > 0 ||
        data.totalHard > 0;

    if (!raw || !hasAnyProgressData) {
        throw new Error("User not found.");
    }

    return data;
}

async function handleSearch(event) {
    event.preventDefault();

    const username = elements.input.value.trim();
    if (!username) {
        setStatus("Please enter a username.", true);
        resetResults();
        return;
    }

    setLoading(true);
    setStatus("Fetching profile...");
    resetResults();

    try {
        const data = await fetchLeetCodeData(username);
        activeUsername = username;
        updateProgress(data);
        setResultsVisible(true);
        setStatus(`Showing results for ${username}.`);
    } catch (error) {
        setStatus(error.message || "Unable to fetch data.", true);
        resetResults();
    } finally {
        setLoading(false);
    }
}

function init() {
    enableDarkThemeOnly();
    resetResults();
    elements.form.addEventListener("submit", handleSearch);
}

document.addEventListener("DOMContentLoaded", init);
