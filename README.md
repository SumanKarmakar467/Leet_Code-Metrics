# LeetCode Metrics

LeetCode Metrics is now a full React.js app with a REST API layer and Vercel-ready deployment setup.

## Stack
- React.js (Vite)
- REST API (`/api/leetcode` as Verel serverless function)
- Vercel

## Features
- Search LeetCode profile by username
- Easy/Medium/Hard solved counts
- Progress rings by difficulty
- Total solved, ranking, and contribution cards

## Run Locally
```bash
npm install
npm run dev
```

App URL in local dev: `http://localhost:5173`

## REST API
Endpoint:
```bash
GET /api/leetcode?username=<leetcode_username>
```

Example:
```bash
GET /api/leetcode?username=suman_karmakar
```

## Deploy To Vercel
1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Deploy with default Vite settings.

Vercel will build the React app and serve the API route from `api/leetcode.js`.