import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const hasApiKey = apiKey.trim().length > 0;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Initialize Google Gen AI if API key is present
const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function getFallbackQuestions(type: string, difficulty: string): string[] {
  const role = (type?.trim() || "software engineer").toLowerCase();
  const level = (difficulty?.toLowerCase() || "medium").trim();

  const pools = {
    frontend: {
      easy: [
        "Walk me through a recent UI feature you built and explain how you kept the experience smooth for users.",
        "How would you debug a React component that re-renders unexpectedly after a small state change?",
        "What makes a UI feel polished when the underlying logic is simple?",
        "How would you explain the difference between controlled and uncontrolled inputs in a React form?",
        "Describe how you would optimize a slow rendering path in a modern frontend app."
      ],
      medium: [
        "A production React app is suddenly slow after a new release. How would you investigate and improve the bottlenecks?",
        "How would you design a data-fetching pattern that stays resilient across flaky network conditions?",
        "Describe how you would structure a component system so the app remains maintainable as it grows.",
        "What trade-offs do you consider when choosing between server rendering and client-side rendering for a modern web app?",
        "How would you approach performance profiling for a UI that feels sluggish during user interaction?",
        "Describe how you would structure state in a large frontend application without creating brittle updates."
      ],
      hard: [
        "How would you architect an interactive dashboard that handles large real-time datasets without freezing the browser?",
        "A team is seeing inconsistent UI performance across devices. How would you investigate and optimize it systematically?",
        "How would you approach code-splitting, rendering strategy, and caching for a high-traffic frontend platform?",
        "How would you design a frontend architecture that remains fast and predictable as the app scales to thousands of components?",
        "Describe how you would debug a subtle memory leak in a long-lived single-page application."
      ]
    },
    backend: {
      easy: [
        "How would you explain the difference between REST and GraphQL in a practical setting?",
        "Describe how you would secure an API endpoint that handles user data.",
        "How would you validate input on the server to prevent broken or unsafe requests?",
        "Explain how you would structure error handling for a backend service that talks to multiple downstream systems."
      ],
      medium: [
        "How would you debug a backend service that returns inconsistent results under load?",
        "Describe a design for a scalable API that can grow with new features and traffic spikes.",
        "How do you decide when to introduce caching versus optimizing the database query path?",
        "How would you design a retry strategy for flaky third-party API calls without making the system unstable?",
        "Describe how you would decide between synchronous and asynchronous processing for a core business workflow."
      ],
      hard: [
        "How would you design a reliable event-driven backend for millions of requests per day?",
        "A service is failing intermittently in production. Walk me through your debugging and mitigation plan.",
        "What observability and reliability practices would you add to a growing platform?",
        "How would you design a backend system that remains consistent across multiple regions and deployment zones?",
        "Describe how you would handle data consistency for a workflow that spans several services."
      ]
    },
    fullstack: {
      easy: [
        "How would you connect a frontend form to a backend service in a secure way?",
        "What would you look for when debugging a login flow across client and server?",
        "How do you decide what should live in the client versus the server in a full-stack app?",
        "Describe how you would keep a shared feature consistent across UI and API layers."
      ],
      medium: [
        "How would you design a production-ready full-stack feature that balances UX, API design, and data consistency?",
        "Describe how you would handle authentication and authorization for a SaaS product with multiple roles.",
        "What are the main trade-offs between SSR and client-side rendering for a full-stack app?",
        "How would you design onboarding and analytics tracking without hurting performance or privacy?",
        "Describe how you would debug a bug that only appears when a feature is exercised end-to-end."
      ],
      hard: [
        "How would you architect a multi-tenant application that must remain reliable as traffic grows?",
        "Describe how you would prevent a full-stack feature from becoming a bottleneck during peak usage.",
        "How would you isolate and debug a production issue that appears only in one environment?",
        "How would you design observability for a platform that spans client, API, and database boundaries?",
        "Describe how you would improve resilience for a large-scale full-stack deployment."
      ]
    },
    dsa: {
      easy: [
        "Explain how you would approach solving a simple array or string problem in an interview setting.",
        "How do you decide whether a problem is better solved with a hash map or a set?",
        "Describe how you would explain the time complexity of a simple loop-based solution.",
        "How would you approach a binary search problem and verify your assumptions before coding?"
      ],
      medium: [
        "How would you explain your approach to solving a tree or graph problem under time pressure?",
        "Describe how you would analyze the complexity of a solution before coding it.",
        "How do you balance readability and performance when solving algorithmic problems?",
        "How would you compare two solutions that both work but differ in memory usage?",
        "Describe how you would reason through a dynamic programming problem step by step."
      ],
      hard: [
        "How would you design an efficient solution for a problem that must scale to large input sizes?",
        "Describe how you would reason through a tricky dynamic programming problem and communicate your steps clearly.",
        "How would you decide between multiple candidate solutions when all seem correct but differ in performance?",
        "How would you optimize a recursive solution that hits stack limits or timeout issues?",
        "Describe how you would test an algorithmic solution against edge cases and worst-case input."
      ]
    },
    hr: {
      easy: [
        "Tell me about a time you had to learn something quickly to meet a deadline.",
        "How do you handle feedback that you disagree with?",
        "Describe a time you had to adapt quickly when priorities changed unexpectedly.",
        "How do you stay organized when several tasks need attention at once?"
      ],
      medium: [
        "Describe a time you had to work with a teammate whose working style was very different from yours.",
        "How do you handle a project that suddenly changes direction near delivery?",
        "Tell me about a conflict you resolved without damaging the relationship.",
        "Describe a time you had to balance personal accountability and team collaboration."
      ],
      hard: [
        "Describe a time you had to influence a team without direct authority.",
        "How would you handle a leadership situation where morale was dropping under pressure?",
        "Tell me about a difficult stakeholder conversation and how you approached it.",
        "Describe a time you had to make a hard decision that affected multiple stakeholders."
      ]
    }
  };

  const rolePool =
    role.includes("front")
      ? pools.frontend
      : role.includes("back")
        ? pools.backend
        : role.includes("full")
          ? pools.fullstack
          : role.includes("dsa") || role.includes("algo")
            ? pools.dsa
            : role.includes("hr") || role.includes("behavior")
              ? pools.hr
              : pools.frontend;

  const difficultyPool =
    level.includes("hard") || level.includes("advanced") || level.includes("senior")
      ? rolePool.hard
      : level.includes("entry") || level.includes("easy") || level.includes("intern")
        ? rolePool.easy
        : rolePool.medium;

  return shuffleArray(difficultyPool).slice(0, 5);
}

function normalizeGeneratedQuestions(rawQuestions: unknown, count: number): string[] {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, count);
}

export async function generateInterviewQuestions(
  type: string,
  difficulty: string,
  resumeText?: string,
  questionCount = 5
): Promise<string[]> {
  const safeQuestionCount = Math.min(10, Math.max(3, Number(questionCount) || 5));
  const normType = (type || "software engineer").trim().toLowerCase();
  const fallbackQuestions = getFallbackQuestions(type, difficulty).slice(0, safeQuestionCount);

  if (!hasApiKey || !genAI) {
    return fallbackQuestions;
  }

  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: geminiModel,
      });

      const prompt = `
You are a Senior Technical Interviewer with experience interviewing candidates at Google, Amazon, Microsoft, Meta, Netflix, Uber, Stripe, Atlassian and OpenAI.

Randomization Seed:
${Date.now()}-${Math.random().toString(36).slice(2, 10)}

Your responsibility is to conduct a realistic software engineering interview.

Generate EXACTLY ${safeQuestionCount} interview questions.

Candidate Information

Role:
${normType}

Difficulty:
${difficulty}

Resume:
${resumeText ? resumeText : "No Resume Provided"}

=================================================

Rules

1. Generate interview questions based on CURRENT interview trends (2025-2026).

2. NEVER generate boring textbook questions.

3. NEVER ask only definitions.

4. Questions must sound conversational like a real interviewer.

5. Make the set feel fresh and different from previous interviews. Use a new mix of topics, angle, and phrasing every time.

5. Mix the following categories naturally.

• Technical Fundamentals

• Practical Development

• Debugging

• Scenario Based

• Architecture / System Design
(skip architecture for HR interviews)

• Resume Based

• Behavioural

6. If resume is provided:

Ask about

Projects

Libraries

Frameworks

Architecture

Trade-offs

Problems faced

Optimization

Deployment

7. Prefer modern technologies whenever possible.

React 19

Next.js

TypeScript

Node.js

Express

Prisma

PostgreSQL

Supabase

Redis

Docker

JWT

OAuth

REST API

GraphQL

CI/CD

GitHub Actions

Vercel

AWS

Caching

Performance

Authentication

Authorization

API Security

8. Difficulty Rules

Easy

• Internship level

• Basic understanding

Medium

• Production thinking

• Debugging

• Optimization

Hard

• Senior engineer thinking

• Scalability

• System Design

• Performance

9. The questions should feel like an interviewer speaking.

Example

❌ Explain React.

✅ Your React application suddenly starts re-rendering every component after a state update. How would you investigate the issue?

❌ Explain JWT.

✅ Users are randomly getting logged out after deployment. Walk me through how you would debug your authentication flow.

10. Avoid duplicate questions.

11. Return ONLY a JSON array.

Example

[
"Question 1",
"Question 2",
"Question 3",
"Question 4",
"Question 5"
]
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        const normalizedQuestions = normalizeGeneratedQuestions(parsed, safeQuestionCount);

        if (normalizedQuestions.length > 0) {
          return normalizedQuestions;
        }
      } catch {
        const matches = cleaned.match(/"([^"]+)"/g);

        if (matches) {
          const normalizedQuestions = normalizeGeneratedQuestions(
            matches.map((q) => q.replace(/"/g, "")),
            safeQuestionCount
          );

          if (normalizedQuestions.length > 0) {
            return normalizedQuestions;
          }
        }
      }
    } catch (err) {
      console.warn("Gemini generation failed. Using fallback questions.", err);
    }
  }

  return fallbackQuestions;
}

export interface QuestionEvaluation {
  score: number;
  technicalAccuracy: number;
  depthOfKnowledge: number;
  communication: number;
  practicalThinking: number;
  bestPractices: number;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
  feedback: string;
  idealAnswer: string;
  topicsToImprove: string[];
}

export async function evaluateAnswers(
  type: string,
  difficulty: string,
  qaPairs: Array<{ question: string; answer: string }>
): Promise<QuestionEvaluation[]> {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: geminiModel });
      const prompt = `
You are a Senior Software Engineering Interviewer at Google, Microsoft, Amazon, Meta, Netflix and OpenAI.

Evaluate the candidate like a REAL interviewer.

Role:
${type}

Difficulty:
${difficulty}

Evaluate EACH answer using the following rubric.

Technical Accuracy (0-10)

Depth of Knowledge (0-10)

Communication (0-10)

Practical Thinking (0-10)

Best Practices (0-10)

Then calculate

overallScore

Also provide

Strengths

Weaknesses

Detailed Feedback

Ideal Answer

Topics To Improve

Hiring Recommendation

Choose ONE

Strong Hire

Hire

Weak Hire

No Hire

Return ONLY JSON.

Example

[
{
"score":8.8,
"technicalAccuracy":9,
"depthOfKnowledge":8,
"communication":9,
"practicalThinking":8,
"bestPractices":9,
"strengths":[
"Strong explanation",
"Good practical example"
],
"weaknesses":[
"Didn't discuss scalability"
],
"hiringRecommendation":"Hire",
"topicsToImprove":[
"Redis",
"Caching"
],
"feedback":"Excellent answer...",
"idealAnswer":"..."
}
]

Candidate Answers

${qaPairs.map((pair, idx) => `
Question ${idx + 1}

${pair.question}

Answer

${pair.answer || "No Answer"}
`).join("\n")}
`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length === qaPairs.length) {
        return parsed.map((item) => ({
          score: typeof item.score === "number" ? item.score : 5,
          technicalAccuracy: typeof item.technicalAccuracy === "number" ? item.technicalAccuracy : 5,
          depthOfKnowledge: typeof item.depthOfKnowledge === "number" ? item.depthOfKnowledge : 5,
          communication: typeof item.communication === "number" ? item.communication : 5,
          practicalThinking: typeof item.practicalThinking === "number" ? item.practicalThinking : 5,
          bestPractices: typeof item.bestPractices === "number" ? item.bestPractices : 5,
          strengths: Array.isArray(item.strengths) ? item.strengths : [],
          weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses : [],
          topicsToImprove: Array.isArray(item.topicsToImprove) ? item.topicsToImprove : [],
          hiringRecommendation: item.hiringRecommendation || "Weak Hire",
          feedback: item.feedback || "Good attempt. Expand your explanation.",
          idealAnswer: item.idealAnswer || "Provide the concept, implementation and real-world example."
        }));
      }
    } catch (error) {
      console.warn("Gemini answer evaluation failed, falling back to local grading:", error);
    }
  }

  return qaPairs.map((pair) => {
    const wordCount = (pair.answer || "").trim().split(/\s+/).filter(Boolean).length;
    const baseScore = wordCount > 50 ? 8 : wordCount > 15 ? 6 : 3;
    const emptyAnswer = !pair.answer || pair.answer.trim().length === 0;

    const score = emptyAnswer ? 0 : baseScore;
    const technicalAccuracy = emptyAnswer ? 0 : Math.min(10, Math.max(3, baseScore + 1));
    const depthOfKnowledge = emptyAnswer ? 0 : Math.min(10, Math.max(3, baseScore + 1));
    const communication = emptyAnswer ? 0 : Math.min(10, Math.max(4, baseScore + 1));
    const practicalThinking = emptyAnswer ? 0 : Math.min(10, Math.max(3, baseScore));
    const bestPractices = emptyAnswer ? 0 : Math.min(10, Math.max(3, baseScore));

    const feedback = emptyAnswer
      ? "You did not provide an answer. In actual interviews, it is always better to speak or write something related rather than leaving it blank."
      : wordCount > 50
        ? "Excellent response! You clearly understand the core concepts. You explained the fundamentals well and gave a solid breakdown. To get a perfect score, consider referencing optimization techniques and memory complexities."
        : wordCount > 15
          ? "Good start, but your answer lacks depth. You defined the basic terminology correctly, but you should discuss implementation details, practical use cases, and how this relates to other components in the stack."
          : "The response is too brief. You should explain the core definition, talk about real-world scenarios, and discuss trade-offs to demonstrate deep knowledge.";

    const idealAnswer = `A strong answer to "${pair.question}" should define the concept clearly, explain how it works in practice, and conclude with a real-world example or trade-off discussion.`;

    return {
      score,
      technicalAccuracy,
      depthOfKnowledge,
      communication,
      practicalThinking,
      bestPractices,
      strengths: emptyAnswer ? [] : ["Clear attempt to address the question"],
      weaknesses: emptyAnswer ? ["No answer was provided"] : ["Could include more implementation detail"],
      hiringRecommendation: emptyAnswer ? "No Hire" : score >= 8 ? "Hire" : score >= 6 ? "Weak Hire" : "No Hire",
      feedback,
      idealAnswer,
      topicsToImprove: emptyAnswer ? ["Answer structure"] : ["Depth", "Practical examples"]
    };
  });
}
