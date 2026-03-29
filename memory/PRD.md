# Discuss - Developer Discussion Platform

## Architecture (Serverless)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Database**: Firebase Realtime Database (direct from frontend)
- **Auth**: Firebase Authentication (Email + Google)
- **Offline**: IndexedDB caching

## What's Been Implemented (Jan 2026)
- [x] Converted to direct Firebase (no backend)
- [x] Removed Python/Render dependency
- [x] Added mobile zoom disable
- [x] Fixed npm dependency conflicts
- [x] Voting system (minimum score 0)
- [x] Real-time posts, comments, votes
- [x] Google and email authentication

## Core Features
- Email/password and Google auth
- Discussion posts and project showcases
- Real-time voting (min 0)
- Real-time comments
- Hashtag support
- Offline caching with IndexedDB

## Deployment
- Frontend only to Netlify/Vercel
- Firebase env vars required
- Add domain to Firebase Authorized Domains

## Firebase Config
- Project: discuss-13fbc
- Database: https://discuss-13fbc-default-rtdb.firebaseio.com
