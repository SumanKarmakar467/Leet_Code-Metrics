const elements = {
    form: document.getElementById("search-form"),
    input: document.getElementById("user-input"),
    searchBtn: document.getElementById("search-btn"),
    themeToggle: document.getElementById("theme-toggle"),
    statusMsg: document.getElementById("status-msg"),
    progressSection: document.querySelector(".progress"),
    statsCards: document.querySelector(".stats-cards"),
    progress: {
        easy: document.querySelector(".easy-progress"),
        medium: document.querySelector(".medium-progress"),
        hard: document.querySelector(".hard-progress")
    },
    labels: {
        easy: document.getElementById("easy-label"),
        medium: document.getElementById("medium-label"),
        hard: document.getElementById("hard-label")
    }
};

const API_BASE = "https://leetcode-api-faisalshohag.vercel.app";

function setStatus(message, isError = false) {
    elements.statusMsg.textContent = message;
    elements.statusMsg.style.color = isError ? "#dc2626" : "var(--muted)";
}

function setLoading(isLoading) {
    elements.searchBtn.disabled = isLoading;
    elements.searchBtn.textContent = isLoading ? "Searching..." : "Search";
}

function setResultsVisible(isVisible) {
    elements.progressSection.hidden = !isVisible;
    elements.statsCards.hidden = !isVisible;
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
}

function updateCards(data) {
    const cards = [
        { title: "Total Solved", value: data.totalSolved ?? 0 },
        { title: "Ranking", value: data.ranking ?? "N/A" },
        { title: "Easy Solved", value: data.easySolved ?? 0 },
        { title: "Medium Solved", value: data.mediumSolved ?? 0 },
        { title: "Hard Solved", value: data.hardSolved ?? 0 },
        { title: "Contribution", value: data.contributionPoint ?? 0 }
    ];

    elements.statsCards.innerHTML = cards
        .map((card) => `<article class="card">${card.value}<span>${card.title}</span></article>`)
        .join("");
}

function applyTheme(theme) {
    const darkMode = theme === "dark";
    document.body.classList.toggle("dark", darkMode);
    elements.themeToggle.textContent = darkMode ? "Light" : "Dark";
    elements.themeToggle.setAttribute("aria-pressed", String(darkMode));
}

function initTheme() {
    let theme = "dark";
    try {
        const saved = localStorage.getItem("leetmetric-theme");
        if (saved === "light" || saved === "dark") {
            theme = saved;
        }
    } catch (error) {
        theme = "dark";
    }

    applyTheme(theme);

    elements.themeToggle.addEventListener("click", () => {
        const next = document.body.classList.contains("dark") ? "light" : "dark";
        applyTheme(next);
        try {
            localStorage.setItem("leetmetric-theme", next);
        } catch (error) {
            // Ignore storage failures.
        }
    });
}

async function fetchLeetCodeData(username) {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(username)}`);
    if (!response.ok) {
        throw new Error("Failed to fetch profile.");
    }

    const data = await response.json();
    if (!data || typeof data.totalSolved !== "number") {
        throw new Error("User not found.");
    }

    return data;
}

async function handleSearch(event) {
    event.preventDefault();

    const username = elements.input.value.trim();
    if (!username) {
        setStatus("Please enter a username.", true);
        setResultsVisible(false);
        return;
    }

    setLoading(true);
    setStatus("Fetching profile...");
    setResultsVisible(false);

    try {
        const data = await fetchLeetCodeData(username);
        updateProgress(data);
        updateCards(data);
        setResultsVisible(true);
        setStatus(`Showing results for ${username}.`);
    } catch (error) {
        setStatus(error.message || "Unable to fetch data.", true);
        elements.statsCards.innerHTML = "";
        setResultsVisible(false);
    } finally {
        setLoading(false);
    }
}

function init() {
    initTheme();
    setResultsVisible(false);
    elements.form.addEventListener("submit", handleSearch);
}

document.addEventListener("DOMContentLoaded", init);

