import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const hasApiKey = apiKey.trim().length > 0;

// Initialize Google Gen AI if API key is present
const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

function getFallbackQuestions(type: string, difficulty: string): string[] {
  const role = type?.trim() || "software engineer";
  const level = difficulty?.toLowerCase() || "medium";

  const baseQuestions = [
    `Walk me through a recent project you built in ${role} and explain the trade-offs you made.`,
    `How would you debug a production issue that appears only under load in a modern web application?`,
    `Describe how you would design a scalable API for a growing product with real-world reliability constraints.`,
    `What would you improve in a codebase that has become hard to maintain over time?`,
    `How do you decide between performance optimization and code simplicity in a team setting?`,
  ];

  if (level.includes("hard") || level.includes("advanced")) {
    return [
      `You are asked to scale a feature that now handles millions of requests per day. How would you approach the architecture and bottlenecks?`,
      `A service is failing intermittently in production. Walk me through your debugging and mitigation plan.`,
      `How would you design a resilient data layer for high availability and low latency?`,
      `Describe how you would review and refactor a legacy system without breaking business-critical flows.`,
      `What observability and reliability practices would you add to a growing platform?`,
    ];
  }

  return baseQuestions;
}

function normalizeGeneratedQuestions(rawQuestions: unknown): string[] {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function generateInterviewQuestions(
  type: string,
  difficulty: string,
  resumeText?: string
): Promise<string[]> {
  const normType = type.toLowerCase();
  const fallbackQuestions = getFallbackQuestions(type, difficulty);

  if (!hasApiKey || !genAI) {
    return fallbackQuestions;
  }

  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `
You are a Senior Technical Interviewer with experience interviewing candidates at Google, Amazon, Microsoft, Meta, Netflix, Uber, Stripe, Atlassian and OpenAI.

Your responsibility is to conduct a realistic software engineering interview.

Generate EXACTLY 5 interview questions.

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
        const normalizedQuestions = normalizeGeneratedQuestions(parsed);

        if (normalizedQuestions.length > 0) {
          return normalizedQuestions;
        }
      } catch {
        const matches = cleaned.match(/"([^"]+)"/g);

        if (matches) {
          const normalizedQuestions = normalizeGeneratedQuestions(
            matches.map((q) => q.replace(/"/g, ""))
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
