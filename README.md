# 🤖InterviewMate
 
InterviewMate is a full-stack AI-powered mock interview platform built with **Next.js**, **TypeScript**, **Prisma**, and **SQLite**. It helps users practice **Frontend, Backend, Full-stack, DSA, and HR interviews** through AI-generated interview questions, answer evaluation, session tracking, bookmarks, and performance insights.
 
The goal of the project is to simulate structured mock interview practice while helping users improve consistency through feedback, saved sessions, and weak-area review.
 
---
 
## ✨ Features
 
### 🎯 Mock Interview Practice
- Start interview sessions across multiple domains:
  - **Frontend**
  - **Backend**
  - **Full-stack**
  - **DSA**
  - **HR**
- Choose interview difficulty:
  - **Entry**
  - **Mid**
  - **Senior**
- Generate interview questions dynamically
- Submit answers and receive AI-based evaluation
### 🤖 AI Feedback Engine
- AI-generated interview questions using **Google Gemini**
- Per-question feedback and scoring
- Session-level feedback summary
- Optional ideal-answer guidance for review
### 📊 Dashboard & Progress Tracking
- Track completed interview sessions
- Monitor practice streaks
- View score history and performance insights
- Review weak areas from previous attempts
### 🔖 Bookmarks
- Bookmark useful or difficult questions
- Revisit important questions for later revision
### 🔐 Authentication
- Register and log in securely
- Session management using **NextAuth**
- Password hashing with **bcryptjs**
### 🎨 Modern UI
- Built with **Next.js App Router**
- Smooth animations using **Framer Motion**
- Visual analytics with **Recharts**
- Interactive UI touches like **canvas-confetti**
---
 
## 🛠 Tech Stack
 
### Frontend
- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion**
- **Recharts**
- **Lucide React**
### Backend / Logic
- **Next.js Route Handlers**
- **NextAuth**
- **Google Generative AI SDK**
- **bcryptjs**
### Database / ORM
- **Prisma ORM**
- **SQLite**
- **better-sqlite3**
---
 
## 📂 Project Structure
 
```bash
InterviewMate/
├── prisma/
│   └── schema.prisma
│
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── bookmarks/
│   │   │   │   └── toggle/route.ts
│   │   │   ├── dashboard/
│   │   │   │   └── stats/route.ts
│   │   │   └── interviews/
│   │   │       ├── generate/route.ts
│   │   │       ├── submit/route.ts
│   │   │       └── [id]/route.ts
│   │   │
│   │   ├── auth/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── interview/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── feedback/page.tsx
│   │   │
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   └── Navbar.tsx
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   ├── hooks/
│   │   └── useAudioRecorder.ts
│   │
│   └── lib/
│       ├── gemini.ts
│       └── prisma.ts
│
├── package.json
└── README.md
```
 
---
 
## 🚀 Core User Flow
 
### 1. Register / Sign In
Users can create an account or log in through the authentication flow.
 
### 2. Start a New Interview
Users go to the **new interview page** and select:
- Interview type (`frontend` / `backend` / `fullstack` / `dsa` / `hr`)
- Difficulty (`entry` / `mid` / `senior`)
### 3. Generate Questions
The app uses the AI interview generation flow to create a session with questions.
 
### 4. Answer Questions
Users answer each question inside the interview session UI.
 
### 5. Submit for Evaluation
Answers are submitted to the AI feedback engine, which returns:
- Score
- Feedback
- Ideal answer (if generated)
### 6. Save and Review
The full session is saved, and the user can:
- Review feedback
- Check session history
- Bookmark questions
- Track performance on the dashboard
---
 
## 🧠 Database Schema Overview
 
InterviewMate currently uses **Prisma + SQLite** with three main models.
 
### `User`
Stores account and practice-tracking information.
 
| Field | Type | Description |
|---|---|---|
| `id` | `String` | Unique user ID |
| `email` | `String` | Unique email |
| `password` | `String` | Hashed password |
| `name` | `String?` | Optional display name |
| `streak` | `Int` | Current practice streak |
| `lastPracticeDate` | `DateTime?` | Last date the user practiced |
| `createdAt` | `DateTime` | Account creation time |
| `updatedAt` | `DateTime` | Last update time |
 
### `InterviewSession`
Represents one complete mock interview session.
 
| Field | Type | Description |
|---|---|---|
| `id` | `String` | Session ID |
| `userId` | `String` | Owner user ID |
| `type` | `String` | Interview domain (`frontend`, `backend`, `fullstack`, `dsa`, `hr`) |
| `difficulty` | `String` | Interview difficulty (`entry`, `mid`, `senior`) |
| `score` | `Float?` | Overall session score |
| `feedback` | `String?` | Overall AI feedback summary |
| `createdAt` | `DateTime` | Session creation timestamp |
 
### `QuestionAttempt`
Represents a single answered question inside an interview session.
 
| Field | Type | Description |
|---|---|---|
| `id` | `String` | Question attempt ID |
| `sessionId` | `String` | Related interview session |
| `questionText` | `String` | Question shown to the user |
| `studentAnswer` | `String` | User's submitted answer |
| `aiScore` | `Float?` | AI-generated score |
| `aiFeedback` | `String?` | AI-generated feedback |
| `idealAnswer` | `String?` | Suggested ideal answer |
| `isBookmarked` | `Boolean` | Whether the question is bookmarked |
 
### Relationships
- One **User** → many **InterviewSession**
- One **InterviewSession** → many **QuestionAttempt**
---
 
## 📡 API Routes
 
InterviewMate uses **Next.js route handlers** for backend functionality.
 
### Auth
 
| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/[...nextauth]` | NextAuth handlers | Authentication and session handling |
 
### Interviews
 
| Route | Method | Purpose |
|---|---|---|
| `/api/interviews/generate` | `POST` | Generate a new interview session/questions |
| `/api/interviews/submit` | `POST` | Submit answers and get AI feedback |
| `/api/interviews/[id]` | `GET` | Fetch a specific interview session |
 
### Dashboard
 
| Route | Method | Purpose |
|---|---|---|
| `/api/dashboard/stats` | `GET` | Fetch dashboard stats, streaks, and progress data |
 
### Bookmarks
 
| Route | Method | Purpose |
|---|---|---|
| `/api/bookmarks/toggle` | `POST` | Bookmark or unbookmark a question |
 
---
 
## 🖥️ App Pages
 
### Public / Shared Pages
- `/` → Landing / home page
- `/auth` → Authentication page
### Protected / Main App Pages
- `/dashboard` → User dashboard with stats and progress
- `/interview/new` → Create a new interview session
- `/interview/[id]` → Active interview session page
- `/interview/[id]/feedback` → Feedback and review page for a completed interview
---
 
## 🔐 Authentication
 
Authentication is implemented with **NextAuth**.
 
Current auth flow includes:
- User registration
- Secure password hashing using **bcryptjs**
- Authenticated session management
- User-linked interview sessions and attempts
---
 
## 🤖 AI Integration
 
InterviewMate uses **Google Gemini** through the `@google/generative-ai` SDK.
 
### AI is used for:
- Generating interview questions
- Evaluating submitted answers
- Assigning AI scores
- Generating feedback summaries
- Optionally producing ideal answers
AI integration logic is handled in:
 
```bash
src/lib/gemini.ts
```
 
---
 
## 🎙️ Audio Support
 
The project includes a custom hook:
 
```bash
src/hooks/useAudioRecorder.ts
```
 
This can be extended into spoken / voice-based interview practice in future versions.
 
---
 
## ⚙️ Getting Started
 
### 1. Clone the repository
 
```bash
git clone https://github.com/ammar-Khan8/InterviewMate.git
cd InterviewMate
git checkout Version-1
```
 
### 2. Install dependencies
 
```bash
npm install
```
 
### 3. Create `.env`
 
Create a `.env` file in the project root and add:
 
```env
DATABASE_URL="file:./dev.db"
 
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
 
GOOGLE_GENERATIVE_AI_API_KEY="your_google_gemini_api_key"
```
 
### 4. Generate Prisma client
 
```bash
npx prisma generate
```
 
### 5. Push the database schema
 
```bash
npx prisma db push
```
 
### 6. Run the development server
 
```bash
npm run dev
```
 
Open your browser at:
 
```
http://localhost:3000
```
 
---
 
## 🧪 Available Scripts
 
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
 
---
 
## 📈 Current Functional Scope
 
At the moment, InterviewMate includes:
 
- ✅ AI-powered mock interview generation
- ✅ Answer submission and AI evaluation
- ✅ Authentication flow
- ✅ Dashboard stats
- ✅ Interview session persistence
- ✅ Question-level feedback
- ✅ Bookmarking support
- ✅ Modern full-stack Next.js app structure
---
 
## 📸 Recommended Screenshots to Add
 
To make the GitHub repo much stronger, add screenshots for:
 
- ✅ Landing page
- ✅ Auth page
- ✅ Dashboard
- ✅ New interview setup page
- ✅ Active interview page
- ✅ Feedback page
Example:
 
```markdown
## Screenshots
 
### Dashboard
![Dashboard](./public/screenshots/dashboard.png)
 
### New Interview
![New Interview](./public/screenshots/new-interview.png)
 
### Feedback
![Feedback](./public/screenshots/feedback.png)
```
 
---
 
## 🔮 Future Improvements
 
Planned upgrades for InterviewMate:
 
- ⬜ Migrate from SQLite to PostgreSQL for production readiness
- ⬜ Add dedicated `Question` and `Bookmark` models instead of storing everything under `QuestionAttempt`
- ⬜ Add topic-level analytics and weak-area tracking
- ⬜ Add role-based question banks and admin management panel
- ⬜ Improve rubric-based AI scoring
- ⬜ Add voice mock interview mode using the audio recording hook
- ⬜ Add richer dashboard analytics and progress charts
- ⬜ Deploy with public demo credentials
---
 
## ⚠️ Notes on the Current Data Model
 
The current schema keeps the project simple and fast to iterate on, but as InterviewMate grows, it would be worth normalizing the database further by introducing dedicated models such as:
 
- `Question`
- `Bookmark`
- `Topic`
- `Feedback`
- `UserTopicPerformance`
This would improve:
 
- ✅ Analytics
- ✅ Question reuse
- ✅ Bookmark management
- ✅ Admin question-bank tooling
- ✅ Long-term scalability
---
 
## 📜 License
 
This project is intended for learning, portfolio, and educational purposes.
 
---
 
## 👨‍💻 Author
 
**Ammar Khan**  
B.Tech CSE Student | Aspiring Full-Stack / SDE Developer
 
GitHub: [ammar-Khan8](https://github.com/ammar-Khan8)
