"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { 
  Mic, Keyboard, Play, Square, RefreshCw, ChevronRight, 
  ArrowUpRight, AlertCircle, Volume2, Save, Send, Sparkles 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface Question {
  id: string;
  questionText: string;
  studentAnswer: string;
}

function normalizeQuestion(rawQuestion: any, index: number): Question {
  const id = rawQuestion?.id || `question-${index + 1}`;
  const questionText = rawQuestion?.questionText || rawQuestion?.question || "No question available.";
  const studentAnswer = rawQuestion?.studentAnswer ?? rawQuestion?.answer ?? "";

  return {
    id,
    questionText,
    studentAnswer,
  };
}

interface Session {
  id: string;
  type: string;
  difficulty: string;
  questions: Question[];
}

export default function InterviewPanel() {
  const router = useRouter();
  const { id } = useParams();

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  
  const [submitting, setSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(0);

  const {
    isRecording,
    audioUrl,
    formattedTime,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  // Load questions
  useEffect(() => {
    if (id) {
      fetch(`/api/interviews/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not retrieve session");
          return res.json();
        })
        .then((data) => {
          const normalizedQuestions = Array.isArray(data?.questions)
            ? data.questions.map((q: any, index: number) => normalizeQuestion(q, index))
            : [];

          setSessionData({
            id: data?.id || id,
            type: data?.type || "general",
            difficulty: data?.difficulty || "medium",
            questions: normalizedQuestions,
          });
          setCurrentIdx(0);

          // Initialize answers map
          const ansMap: Record<string, string> = {};
          normalizedQuestions.forEach((q: Question) => {
            ansMap[q.id] = q.studentAnswer || "";
          });
          setAnswers(ansMap);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load interview. Please return to dashboard.");
          setLoading(false);
        });
    }
  }, [id]);

  const getSafeQuestionIndex = () => {
    if (!sessionData?.questions?.length) return -1;
    return Math.min(Math.max(currentIdx, 0), sessionData.questions.length - 1);
  };

  // Handle typing answers
  const handleTextChange = (text: string) => {
    const safeIndex = getSafeQuestionIndex();
    if (sessionData && safeIndex >= 0) {
      const qId = sessionData.questions[safeIndex]?.id;
      if (qId) {
        setAnswers((prev) => ({ ...prev, [qId]: text }));
      }
    }
  };

  // Simulates speech-to-text when stop recording
  const handleSimulateTranscribe = () => {
    stopRecording();
    // Simulate rich speech transcription for demo purposes
    const safeIndex = getSafeQuestionIndex();
    if (sessionData && safeIndex >= 0) {
      const qId = sessionData.questions[safeIndex]?.id;
      if (!qId) return;

      const currentAns = answers[qId] || "";
      const transcription = 
        currentAns 
          ? currentAns + " (Voice addition: In addition, we must evaluate memory consumption and clean up references dynamically.)"
          : "Under the hood, we evaluate key parameters. We instantiate connection hooks, establish listeners, check state variables, and avoid data race locks. For scale, we apply cache layers, balance threads, and run non-blocking loops.";
      
      setAnswers((prev) => ({ ...prev, [qId]: transcription }));
      alert("Simulated Transcript Applied! You can edit the text below.");
    }
  };

  const nextQuestion = () => {
    if (sessionData?.questions?.length) {
      clearRecording();
      setCurrentIdx((prev) => Math.min(prev + 1, sessionData.questions.length - 1));
    }
  };

  const prevQuestion = () => {
    clearRecording();
    setCurrentIdx((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    if (!sessionData) return;
    setSubmitting(true);
    setSubmittingStep(0);

    // Format payload
    const payload = {
      sessionId: sessionData.id,
      answers: Object.keys(answers).map((qId) => ({
        questionId: qId,
        answer: answers[qId] || "",
      })),
    };

    try {
      const res = await fetch("/api/interviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTimeout(() => {
          router.replace(`/interview/${sessionData.id}/feedback`);
        }, 1500);
      } else {
        alert("Failed to submit responses. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Submission error. Please try again.");
      setSubmitting(false);
    }
  };

  // Steps for submission screen
  const gradingSteps = [
    "Submitting candidate logs to AI database...",
    "Scanning responses for tech terminology...",
    "Comparing architectures with industrial standards...",
    "Generating score cards out of 10...",
    "Drafting ideal candidate explanations...",
    "Finalizing review logs..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submitting) {
      interval = setInterval(() => {
        setSubmittingStep((prev) => {
          if (prev < gradingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <span className="text-sm font-semibold text-zinc-400 mt-4">Setting up interview desk...</span>
      </div>
    );
  }

  if (error || !sessionData || !sessionData.questions?.length) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">{error || "No interview questions were generated for this session."}</h3>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary mt-6 rounded-xl px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const safeQuestionIndex = getSafeQuestionIndex();
  const currentQuestion = safeQuestionIndex >= 0 ? sessionData.questions[safeQuestionIndex] : null;
  if (!currentQuestion) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">This interview session is missing the requested question.</h3>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary mt-6 rounded-xl px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const progressPercent = ((safeQuestionIndex + 1) / sessionData.questions.length) * 100;
  const currentVal = currentQuestion?.id ? answers[currentQuestion.id] || "" : "";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none">
      <Navbar />

      <AnimatePresence mode="wait">
        {!submitting ? (
          <div className="flex-grow max-w-6xl w-full mx-auto px-6 py-10 flex flex-col justify-between">
            {/* Header progress info */}
            <div className="flex justify-between items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                  Live Mock: {sessionData.type} • {sessionData.difficulty}
                </span>
                <h2 className="text-sm text-zinc-400 font-semibold mt-2">
                  Question {currentIdx + 1} of {sessionData.questions.length}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 font-bold">Progress: {Math.round(progressPercent)}%</span>
                <div className="w-32 bg-zinc-900 border border-zinc-800 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-350"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Core Workspace Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start my-auto">
              
              {/* Left Column: Question statement */}
              <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 min-h-[220px] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Question Prompt</h3>
                  <p className="text-base md:text-lg font-bold text-white leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[10px] text-zinc-500 font-semibold border-t border-zinc-850/60 pt-4">
                  <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Give detailed answers to secure a higher placement score.</span>
                </div>
              </div>

              {/* Right Column: Input Desk */}
              <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col min-h-[350px]">
                {/* Input Selector Tabs */}
                <div className="flex border-b border-zinc-850 pb-4 justify-between items-center mb-6">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Candidate Response</span>
                  <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-850">
                    <button
                      onClick={() => setInputMode("text")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        inputMode === "text"
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      <span>Write</span>
                    </button>
                    <button
                      onClick={() => setInputMode("voice")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        inputMode === "voice"
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Speak</span>
                    </button>
                  </div>
                </div>

                {/* Input Desk panels */}
                <div className="flex-grow flex flex-col">
                  {inputMode === "text" ? (
                    <textarea
                      placeholder="Write your explanation here. Discuss definitions, use cases, patterns, and coding layouts..."
                      value={currentVal}
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="w-full flex-grow min-h-[220px] bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-xs font-medium text-white transition-colors leading-relaxed outline-none resize-none"
                    />
                  ) : (
                    <div className="flex-grow flex flex-col justify-center items-center py-6">
                      <AnimatePresence mode="wait">
                        {isRecording ? (
                          <motion.div
                            key="recording"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center flex flex-col items-center"
                          >
                            {/* Visual Wave */}
                            <div className="relative mb-6 flex justify-center items-center h-20 w-20">
                              <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-red-500/20 opacity-75" />
                              <span className="animate-pulse absolute inline-flex h-12 w-12 rounded-full bg-red-500/40 opacity-75" />
                              <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                                <Mic className="h-5 w-5" />
                              </div>
                            </div>
                            <span className="text-xl font-black text-white font-mono">{formattedTime}</span>
                            <span className="text-xs text-zinc-400 font-bold mt-2 animate-pulse">Capturing microphone...</span>

                            <button
                              onClick={handleSimulateTranscribe}
                              className="mt-8 rounded-full bg-zinc-950 border border-zinc-800 px-6 py-3 text-xs font-bold text-white hover:bg-zinc-900 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                            >
                              <Square className="h-3.5 w-3.5 fill-white text-white" />
                              <span>Stop & Transcribe</span>
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center flex flex-col items-center"
                          >
                            <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                              <Mic className="h-7 w-7" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Record Audio Answer</h4>
                            <p className="text-xs text-zinc-500 max-w-[220px] mx-auto mt-2 leading-relaxed font-medium">
                              Press start and explain your answer clearly using your microphone.
                            </p>

                            <button
                              onClick={startRecording}
                              className="mt-6 rounded-full btn-primary px-6 py-3 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
                            >
                              <Play className="h-3.5 w-3.5 fill-white text-white" />
                              <span>Start Recording</span>
                            </button>

                            {audioUrl && (
                              <div className="mt-8 pt-6 border-t border-zinc-850/60 w-full max-w-[260px] text-center flex flex-col items-center">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Review playout</span>
                                <audio src={audioUrl} controls className="h-8 w-full max-w-[220px] bg-zinc-950 rounded-lg" />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Optional Transcript edit reminder */}
                {inputMode === "voice" && currentVal && (
                  <div className="mt-6">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Edited Transcription</label>
                    <textarea
                      value={currentVal}
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="w-full min-h-[80px] bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl p-3 text-[11px] font-medium text-zinc-300 transition-colors leading-relaxed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-t border-zinc-900">
              <button
                onClick={prevQuestion}
                disabled={currentIdx === 0}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>

              {currentIdx === sessionData.questions.length - 1 ? (
                <button
                  onClick={handleFinish}
                  className="rounded-xl btn-primary px-6 py-3 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  <span>Finish Mock & Grade</span>
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="rounded-xl btn-primary px-6 py-3 text-xs font-bold text-white flex items-center gap-1 transition-all hover:gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow grid-bg radial-light flex items-center justify-center py-12 px-6">
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-850 rounded-2xl p-8 text-center shadow-2xl z-10 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-md" />
                <Sparkles className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Responses</h3>
              <p className="text-xs text-zinc-500 max-w-[260px] mx-auto leading-relaxed mb-6 font-medium">
                Wait a few seconds. The AI compiler is grading your code and drafting reports.
              </p>

              {/* Progress Step display */}
              <div className="w-full rounded-xl bg-zinc-950/80 border border-zinc-850 p-4 min-h-[60px] flex items-center justify-center">
                <motion.span
                  key={submittingStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-indigo-400"
                >
                  {gradingSteps[submittingStep]}
                </motion.span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
