"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Bookmark, ChevronLeft, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, AlertCircle, ArrowLeft, RefreshCw, Sparkles, BookOpen 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import confetti from "canvas-confetti";

interface Question {
  id: string;
  questionText: string;
  studentAnswer: string;
  aiScore: number | null;
  aiFeedback: string | null;
  idealAnswer: string | null;
  isBookmarked: boolean;
}

interface Session {
  id: string;
  type: string;
  difficulty: string;
  score: number | null;
  feedback: string | null;
  questions: Question[];
}

export default function InterviewFeedback() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [bookmarking, setBookmarking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetch(`/api/interviews/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not retrieve session");
          return res.json();
        })
        .then((data) => {
          setSessionData(data);
          setLoading(false);
          
          // Fire confetti if average score is solid!
          if (data.score && data.score >= 6) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#6366f1", "#a78bfa", "#34d399", "#f59e0b"]
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load feedback. Return to dashboard.");
          setLoading(false);
        });
    }
  }, [id]);

  const toggleBookmark = async (qId: string, currentStatus: boolean) => {
    if (bookmarking[qId]) return;
    setBookmarking((prev) => ({ ...prev, [qId]: true }));

    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionAttemptId: qId,
          isBookmarked: !currentStatus,
        }),
      });

      if (res.ok) {
        setSessionData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: prev.questions.map((q) => {
              if (q.id === qId) {
                return { ...q, isBookmarked: !currentStatus };
              }
              return q;
            }),
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookmarking((prev) => ({ ...prev, [qId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <span className="text-sm font-semibold text-zinc-400 mt-4">Drafting AI evaluation logs...</span>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">{error || "Interview Session Missing"}</h3>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary mt-6 rounded-xl px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const score = sessionData.score !== null ? Number(sessionData.score.toFixed(1)) : 0;

  // Custom text color based on score tier
  const scoreColorClass = 
    score >= 8 
      ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5"
      : score >= 5
      ? "text-amber-400 border-amber-500/25 bg-amber-500/5"
      : "text-red-400 border-red-500/25 bg-red-500/5";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none pb-16">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-8">
        
        {/* Back navigation */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors mb-8 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Dashboard Overview</span>
        </button>

        {/* Score Card Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 mb-10 relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Big Score badge */}
          <div className={`h-32 w-32 shrink-0 rounded-2xl border flex flex-col items-center justify-center ${scoreColorClass}`}>
            <Award className="h-6 w-6 mb-1" />
            <span className="text-4xl font-black font-mono leading-none">{score}</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mt-1.5">Score</span>
          </div>

          <div className="text-center md:text-left flex-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest capitalize bg-indigo-500/10 px-2.5 py-0.5 rounded">
              {sessionData.type} Track • {sessionData.difficulty}
            </span>
            <h2 className="text-2xl font-black text-white mt-3 tracking-tight">AI Interview Evaluation</h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed font-medium">
              {sessionData.feedback}
            </p>
          </div>
        </motion.div>

        {/* Question Breakdown List */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
            <span>Question Breakdown ({sessionData.questions.length})</span>
          </h3>

          {sessionData.questions.map((q, idx) => {
            const isExpanded = expandedQuestion === q.id;
            const qScore = q.aiScore !== null ? Number(q.aiScore.toFixed(0)) : 0;
            const hasAnswer = q.studentAnswer && q.studentAnswer.trim().length > 0;

            const qScoreColorClass = 
              qScore >= 8 
                ? "text-emerald-400 bg-emerald-500/10"
                : qScore >= 5
                ? "text-amber-400 bg-amber-500/10"
                : "text-red-400 bg-red-500/10";

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Header accordion trigger */}
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/50 select-none"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span className="text-xs font-bold text-zinc-500 mt-1 font-mono">Q{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-indigo-400 leading-snug line-clamp-1">
                        {q.questionText}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${qScoreColorClass}`}>
                          {qScore}/10
                        </span>
                        {!hasAnswer && (
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">
                            Empty Response
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bookmark Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(q.id, q.isBookmarked);
                      }}
                      disabled={bookmarking[q.id]}
                      className={`p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ${
                        q.isBookmarked ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title={q.isBookmarked ? "Remove bookmark" : "Bookmark question"}
                    >
                      <Bookmark className="h-4.5 w-4.5" fill={q.isBookmarked ? "currentColor" : "none"} />
                    </button>

                    {/* Expand icon */}
                    <div className="p-2 text-zinc-500 hover:text-white rounded-lg">
                      {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-zinc-850 bg-zinc-950/40 p-5 space-y-4"
                    >
                      {/* Your response */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Your Response</h4>
                        <p className="text-xs text-zinc-300 bg-zinc-950/80 p-4 rounded-xl leading-relaxed border border-zinc-850/50 font-medium">
                          {q.studentAnswer || "[No response submitted]"}
                        </p>
                      </div>

                      {/* AI Critique */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">AI Critique</h4>
                        <p className="text-xs text-zinc-300 bg-zinc-950/80 p-4 rounded-xl leading-relaxed border border-zinc-850/50 font-medium">
                          {q.aiFeedback || "No feedback generated."}
                        </p>
                      </div>

                      {/* Ideal Answer */}
                      <div>
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Ideal Model Answer</h4>
                        <p className="text-xs text-indigo-200 bg-indigo-950/20 border border-indigo-950/30 p-4 rounded-xl leading-relaxed font-medium">
                          {q.idealAnswer || "Ideal answer model not loaded."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </section>

        {/* Footer Actions */}
        <section className="flex gap-4 justify-center items-center mt-12 pt-6 border-t border-zinc-900">
          <button
            onClick={() => router.push("/interview/new")}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            Practice Another Mock
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl btn-primary px-6 py-3.5 text-xs font-bold text-white cursor-pointer"
          >
            Return to Dashboard
          </button>
        </section>
      </main>
    </div>
  );
}
