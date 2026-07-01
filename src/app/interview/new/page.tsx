"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, GraduationCap, ChevronLeft, ArrowRight, 
  Sparkles, Code2, Server, Database, Layers, BrainCircuit, HeartHandshake
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function NewInterview() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [type, setType] = useState("frontend");
  const [difficulty, setDifficulty] = useState("entry");
  const [questionCount, setQuestionCount] = useState(5);
  const [resumeText, setResumeText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  // Animated generating steps
  const steps = [
    "Establishing connection to AI Core...",
    "Analyzing requested role profile...",
    "Reviewing resume references & candidate profile...",
    `Compiling ${questionCount} custom industrial-grade questions...`,
    "Structuring database transaction sessions...",
    "Ready! Opening live panel..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);

    try {
      const res = await fetch("/api/interviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, difficulty, questionCount, resumeText }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        setTimeout(() => {
          router.replace(`/interview/${data.id}`);
        }, 1200);
      } else {
        alert(data.error || "Failed to generate interview. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const tracks = [
    { id: "frontend", label: "Frontend", desc: "React, JS, CSS, Browser APIs, UI optimization", icon: <Code2 className="h-6 w-6" /> },
    { id: "backend", label: "Backend", desc: "Databases, REST, APIs, Caching, Systems", icon: <Server className="h-6 w-6" /> },
    { id: "fullstack", label: "Fullstack", desc: "Client-server architecture, CORS, SSR, Security", icon: <Layers className="h-6 w-6" /> },
    { id: "dsa", label: "DSA", desc: "Algorithms, Trees, Graphs, Complexity analysis", icon: <BrainCircuit className="h-6 w-6" /> },
    { id: "hr", label: "HR / Behavioral", desc: "Leadership, conflict resolution, work culture", icon: <HeartHandshake className="h-6 w-6" /> },
  ];

  const levels = [
    { id: "entry", label: "Entry Level / Intern", desc: "Focuses on fundamentals, syntax, and basic logic." },
    { id: "mid", label: "Mid Level / Junior", desc: "Addresses patterns, implementation, and API integrations." },
    { id: "senior", label: "Senior Engineer", desc: "Tests architectural trade-offs, scales, and performance." },
  ];

  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none pb-16">
      <Navbar />

      <div className="flex-grow grid-bg radial-light flex items-center justify-center py-10 px-6">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key="setup-form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-3xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 relative shadow-2xl z-10"
            >
              {/* Back Link */}
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors mb-6 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Configure Mock Interview</span>
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                </h2>
                <p className="text-sm text-zinc-400 mt-1.5 font-medium">
                  Define your parameters and let our AI compile custom, industry-relevant placement questions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Track Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">1. Select Interview Track</label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => setType(track.id)}
                        className={`rounded-xl p-4 border cursor-pointer transition-all flex items-start gap-3.5 group shadow-sm select-none ${
                          type === track.id
                            ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/40"
                            : "bg-zinc-950 border-zinc-850/80 hover:border-zinc-700/80"
                        }`}
                      >
                        <div className={`mt-0.5 p-2 rounded-lg ${
                          type === track.id
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-200"
                        } transition-colors`}>
                          {track.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {track.label}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-normal line-clamp-2">
                            {track.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Difficulty Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">2. Select Difficulty Level</label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {levels.map((lvl) => (
                      <div
                        key={lvl.id}
                        onClick={() => setDifficulty(lvl.id)}
                        className={`rounded-xl p-4 border cursor-pointer transition-all text-left flex flex-col justify-between group shadow-sm select-none ${
                          difficulty === lvl.id
                            ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/40"
                            : "bg-zinc-950 border-zinc-850/80 hover:border-zinc-700/80"
                        }`}
                      >
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors capitalize">
                          {lvl.label}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                          {lvl.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Question Count Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">3. How many questions?</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[3, 5, 7, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`rounded-xl border px-4 py-3 text-left transition-all ${
                          questionCount === count
                            ? "border-indigo-500 bg-indigo-600/10 text-white"
                            : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="text-sm font-semibold">{count} Questions</div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          {count <= 3 ? "Quick round" : count <= 5 ? "Balanced session" : "Extended practice"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Resume / Custom context */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      4. Resume context or Focus keywords (Optional)
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      Advanced AI Injection
                    </span>
                  </div>
                  <textarea
                    placeholder="Paste your resume, skills profile, or specific topics you want to practice (e.g. Next.js App Router, JWT Token Storage, binary tree balancing, Redux, behavior conflicts)..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full min-h-[100px] bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-xs font-medium text-white transition-colors leading-relaxed"
                  />
                </div>

                {/* Trigger Button */}
                <button
                  type="submit"
                  className="btn-primary w-full py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  <span>Build AI Mock Interview Session</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="setup-loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-850 rounded-2xl p-8 text-center shadow-2xl z-10 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-md" />
                <Sparkles className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Formulating Placement Exam</h3>
              <p className="text-xs text-zinc-500 max-w-[260px] mx-auto leading-relaxed mb-6 font-medium">
                Wait a few seconds. The AI interviewer is creating structural questions for your profile.
              </p>

              {/* Progress Step display */}
              <div className="w-full rounded-xl bg-zinc-950/80 border border-zinc-850 p-4 min-h-[60px] flex items-center justify-center">
                <motion.span
                  key={loadingStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-indigo-400"
                >
                  {steps[loadingStep]}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
