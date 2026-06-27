import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const hasApiKey = apiKey.trim().length > 0;

// Initialize Google Gen AI if API key is present
const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

// Realistic mock questions fallback
const mockQuestions: Record<string, string[]> = {
  frontend: [
    "Explain the difference between Virtual DOM and Shadow DOM, and how React utilizes the Virtual DOM.",
    "What are React Hooks? Explain the rules of Hooks and how useEffect dependency arrays work.",
    "Describe CSS Grid vs. Flexbox. When would you choose one over the other?",
    "Explain event delegation in JavaScript and why it is useful for performance.",
    "How does the browser event loop work, and how does it handle microtasks vs. macrotasks?"
  ],
  backend: [
    "What is the difference between SQL and NoSQL databases? When should you choose PostgreSQL over MongoDB?",
    "Explain RESTful API design principles and how HTTP status codes (2xx, 3xx, 4xx, 5xx) are mapped to errors.",
    "How do you handle authentication and authorization in a stateless distributed environment (e.g., JWT vs. Sessions)?",
    "What is connection pooling in database access, and why is it important for backend scalability?",
    "Explain horizontal vs. vertical scaling and how caching layers (like Redis) help improve API performance."
  ],
  fullstack: [
    "Describe the flow of data in a standard modern client-server architecture, from browser request to database query and back.",
    "How would you optimize a slow-loading web page? Address both frontend asset loading and backend API response times.",
    "What is Cross-Origin Resource Sharing (CORS), why does it happen, and how do you configure it securely?",
    "Explain Server-Side Rendering (SSR) vs. Static Site Generation (SSG) in frameworks like Next.js.",
    "How do you implement secure file uploads in a full-stack application, ensuring both frontend progress indicators and backend security validations?"
  ],
  dsa: [
    "Explain the difference between a stack and a queue, and list one practical use-case for each in software development.",
    "What is the time complexity of searching in a binary search tree (BST) in the worst case, and how can we balance it?",
    "Describe the QuickSort sorting algorithm. What is its average and worst-case time complexity, and how do we choose the pivot?",
    "What is a hash collision, and how is it resolved using chaining vs. open addressing?",
    "Explain the Breadth-First Search (BFS) and Depth-First Search (DFS) graph traversal algorithms, and when to use which."
  ],
  hr: [
    "Tell me about a time you faced a difficult technical challenge during a project. How did you approach and resolve it?",
    "Why do you want to join our internship program, and what specific skills do you hope to learn and apply here?",
    "How do you handle constructive criticism or disagreement with a peer or supervisor when collaborating on a team?",
    "Where do you see yourself in three years, and how does this internship fit into your long-term career goals?",
    "Describe a situation where you had to learn a completely new technology or tool under a tight deadline. What was your strategy?"
  ]
};

// Generates 5 custom questions based on category and difficulty
export async function generateInterviewQuestions(type: string, difficulty: string, resumeText?: string): Promise<string[]> {
  const normType = type.toLowerCase();
  
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an elite tech interviewer. Generate exactly 5 interview questions for a ${difficulty}-level position focusing on the ${normType} stack.
        ${resumeText ? `Take into consideration this candidate's resume/skills profile: "${resumeText}".` : ""}
        
        Requirements:
        1. Return ONLY a JSON array of strings containing the questions.
        2. Do not include markdown formatting like \`\`\`json or \`\`\`.
        3. Make the questions challenging, relevant, and modern.
        
        Example format:
        ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Attempt to clean JSON markdown if the model ignored instructions
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length === 5) {
        return parsed;
      }
    } catch (error) {
      console.warn("Gemini question generation failed, falling back to local questions:", error);
    }
  }

  // Fallback to local questions matching the category
  const list = mockQuestions[normType] || mockQuestions.frontend;
  return [...list];
}

export interface QuestionEvaluation {
  score: number;       // out of 10
  feedback: string;    // what was good, what to improve
  idealAnswer: string; // recommended standard answer
}

// Evaluates a set of answers for a session
export async function evaluateAnswers(
  type: string,
  difficulty: string,
  qaPairs: Array<{ question: string; answer: string }>
): Promise<QuestionEvaluation[]> {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an elite tech evaluator. Assess the following candidate responses for a ${difficulty}-level ${type} interview.
        For each response, provide:
        1. An integer score from 1 to 10.
        2. Detailed feedback pointing out what they got right, what was missing, and how to improve.
        3. An elegant, industry-grade ideal answer.
        
        Return ONLY a JSON array containing objects structured exactly like this:
        [
          {
            "score": 8,
            "feedback": "Your explanation of ... was spot-on, but you forgot to mention ...",
            "idealAnswer": "An ideal answer would state that ..."
          }
        ]
        
        Ensure there are exactly ${qaPairs.length} items in the response array, corresponding to the questions below:
        
        ${qaPairs.map((pair, idx) => `
        ---
        Question ${idx + 1}: ${pair.question}
        Candidate Answer ${idx + 1}: ${pair.answer || "[No answer provided]"}
        `).join("\n")}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed) && parsed.length === qaPairs.length) {
        return parsed.map((item) => ({
          score: typeof item.score === "number" ? item.score : 5,
          feedback: item.feedback || "Good effort. Consider adding more details about implementation specifics.",
          idealAnswer: item.idealAnswer || "A standard response covers the core definition and mentions a brief example."
        }));
      }
    } catch (error) {
      console.warn("Gemini answer evaluation failed, falling back to local grading:", error);
    }
  }

  // Fallback to local evaluation
  return qaPairs.map((pair) => {
    const wordCount = (pair.answer || "").trim().split(/\s+/).filter(Boolean).length;
    let score = 3;
    let feedback = "The response is too brief. You should explain the core definition, talk about real-world scenarios, and discuss trade-offs to demonstrate deep knowledge.";
    let idealAnswer = `To answer "${pair.question}" successfully, start by stating the definition clearly. Then, explain how it operates under the hood, and conclude with a practical implementation example or comparison.`;

    if (wordCount > 50) {
      score = 8;
      feedback = "Excellent response! You clearly understand the core concepts. You explained the fundamentals well and gave a solid breakdown. To get a perfect score, consider referencing optimization techniques and memory complexities.";
      idealAnswer = `An elite answer to "${pair.question}" starts by defining the term. In practice, we use design patterns, hook frameworks, or database index optimizations. For instance, in a production setup, we monitor logs and implement throttling or lazy loading to reduce bottlenecks.`;
    } else if (wordCount > 15) {
      score = 6;
      feedback = "Good start, but your answer lacks depth. You defined the basic terminology correctly, but you should discuss implementation details, practical use cases, and how this relates to other components in the stack.";
      idealAnswer = `A complete answer for "${pair.question}" outlines the main definitions and structures the response logically. It is helpful to mention specific APIs, methods, or parameters, explaining their purpose and when to use them.`;
    }

    if (!pair.answer || pair.answer.trim().length === 0) {
      score = 0;
      feedback = "You did not provide an answer. In actual interviews, it is always better to speak or write something related rather than leaving it blank.";
    }

    return { score, feedback, idealAnswer };
  });
}
