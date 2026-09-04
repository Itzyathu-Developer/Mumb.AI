# Decidr AI 🚦

Created by Yatharth Bochare (`itzyathu_12`).

## Problem
Mumbai’s traffic is unpredictable, and people struggle to make optimal route decisions due to a lack of structured insights.

## Solution
Decidr AI combines AI-driven predictions with real-time community observations to provide smarter route decisions.

## Features
- AI-based route decision engine
- Community traffic updates
- Real-time decision suggestions
- Clean interactive UI

## Tech Stack
- Frontend: HTML, CSS, JS
- Backend: Node.js, Express
- AI: Mumb.AI decision engine with configurable Gemini or Groq inference

## How it works
User inputs a route → AI analyses → combines with community data → suggests the best decision.

## Email verification setup
Signup uses a real 6-digit email verification code. It is delivered through Resend, and pending codes are stored server-side in Netlify Blobs for 10 minutes.

1. Create a Resend account and verify the domain you will send from.
2. In Netlify, set `RESEND_API_KEY` and `VERIFICATION_FROM_EMAIL` under Site configuration → Environment variables.
3. For local development, copy `.env.example` to `.env` and replace both values, then run `npx netlify dev`.

The sender must be an address on a domain verified in Resend. The function does not log or return verification codes.

## Demo
https://decidr-ai.netlify.app

## Future Scope
- Live traffic API integration
- Mobile app
- Predictive congestion modeling
