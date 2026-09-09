# Mumb.AI 

Created by Yatharth Ganesh Bochare (`itzyathu_12`).

## Problem
Mumbai’s traffic is unpredictable, and people struggle to make optimal route decisions due to a lack of structured insights.

## Solution
Mumb.AI combines AI-driven predictions with real-time community observations to provide smarter route decisions.

## Features
- AI-based route decision engine
- Community traffic updates
- Real-time decision suggestions
- Clean interactive UI

## Tech Stack
- Frontend: HTML, CSS, JS
- Backend: Netlify Functions with Vercel-compatible Node function adapters
- AI: Mumb.AI decision engine with configurable Groq or Gemini inference

## How it works
User inputs a route → AI analyses → combines with community data → suggests the best decision.

## Deployment

The static site and API can be deployed to either Netlify or Vercel.

- Netlify: deploy the repository with `netlify.toml`; set `GROQ_API_KEY` or `GEMINI_API_KEY` and the email variables in the Netlify dashboard.
- Vercel: import the repository; Vercel detects `index.html` and the `api/` functions automatically. Set the AI and email variables, plus `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for email verification storage.

The frontend uses `/api/*`, so the same build works on both providers.

## Link
https://mumb-ai.netlify.app

## Future Scope
- Live traffic API integration
- Mobile app
- Predictive congestion moddeling
