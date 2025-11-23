document.addEventListener("DOMContentLoaded", () => {

    // Search button
    document.getElementById("search-btn").addEventListener("click", async () => {
        const username = document.getElementById("user-input").value.trim();
        if (!username) return alert("Enter username!");

        const url = `https://leetcode-api-faisalshohag.vercel.app/${username}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data?.totalSolved) {
                alert("User not found");
                return;
            }

            updateProgress(data);
            updateCards(data);

        } catch (err) {
            alert("Fetch error");
        }
    });

    // Theme toggle
    const toggleBtn = document.getElementById("theme-toggle");

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        toggleBtn.textContent =
            document.body.classList.contains("dark") ? "☀️" : "🌙";
    });
});

function updateProgress(data) {
    const easy = Math.round((data.easySolved / data.totalEasy) * 100);
    const medium = Math.round((data.mediumSolved / data.totalMedium) * 100);
    const hard = Math.round((data.hardSolved / data.totalHard) * 100);

    document.querySelector(".easy-progress")
        .style.setProperty("--progress-degree", `${easy}%`);
    document.querySelector(".medium-progress")
        .style.setProperty("--progress-degree", `${medium}%`);
    document.querySelector(".hard-progress")
        .style.setProperty("--progress-degree", `${hard}%`);

    document.getElementById("easy-label").textContent = `${easy}%`;
    document.getElementById("medium-label").textContent = `${medium}%`;
    document.getElementById("hard-label").textContent = `${hard}%`;
}

function updateCards(data) {
    document.querySelector(".stats-cards").innerHTML = `
        <div class="card">Total Solved: ${data.totalSolved}</div>
        <div class="card">Ranking: ${data.ranking}</div>
        <div class="card">Easy: ${data.easySolved}</div>
        <div class="card">Medium: ${data.mediumSolved}</div>
        <div class="card">Hard: ${data.hardSolved}</div>
        <div class="card">Contribution: ${data.contributionPoint}</div>
    `;
}
