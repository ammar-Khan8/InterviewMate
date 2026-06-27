"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Award, Bookmark, History, Target, AlertTriangle, 
  ArrowRight, ShieldCheck, Sparkles, ExternalLink, Calendar, CheckSquare, X
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer
} from "recharts";

interface SkillStat {
  subject: string;
  score: number;
  fullMark: number;
}

interface Attempt {
  id: string;
  type: string;
  difficulty: string;
  score: number | null;
  date: string;
  questionCount: number;
}

interface BookmarkedQuestion {
  id: string;
  questionText: string;
  studentAnswer: string;
  aiScore: number | null;
  aiFeedback: string | null;
  idealAnswer: string | null;
  type: string;
  difficulty: string;
  date: string;
}

interface DashboardData {
  name: string;
  streak: number;
  skills: SkillStat[];
  weakTopics: string[];
  history: Attempt[];
  bookmarks: BookmarkedQuestion[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "bookmarks">("history");
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkedQuestion | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/dashboard/stats")
        .then((res) => res.json())
        .then((stats) => {
          setData(stats);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching stats:", err);
          setLoading(false);
        });
    }
  }, [session]);

  const handleToggleBookmark = async (qAttemptId: string) => {
    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionAttemptId: qAttemptId, isBookmarked: false }),
      });
      if (res.ok) {
        // Remove from list
        if (data) {
          setData({
            ...data,
            bookmarks: data.bookmarks.filter((b) => b.id !== qAttemptId),
          });
        }
        if (selectedBookmark?.id === qAttemptId) {
          setSelectedBookmark(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <span className="text-sm font-semibold text-zinc-400 mt-4">Loading stats...</span>
      </div>
    );
  }

  const hasHistory = data && data.history && data.history.length > 0;
  
  // Custom theme colors for skills radar chart
  const customRadarColors = {
    stroke: "#818cf8",
    fill: "#6366f1",
    grid: "#27272a",
    text: "#a1a1aa",
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none pb-12">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              <span>Candidate Workspace</span>
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Welcome back, <span className="text-zinc-200 font-semibold">{data?.name}</span>. Evaluate and improve your skills.
            </p>
          </div>

          <button
            onClick={() => router.push("/interview/new")}
            className="btn-primary rounded-xl px-6 py-3.5 text-sm font-bold text-white flex items-center gap-2 cursor-pointer"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </section>

        {/* Top KPI Cards Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame className="h-6 w-6 fill-orange-500/20" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold">PRACTICE STREAK</p>
              <h3 className="text-2xl font-black text-white mt-1">{data?.streak} Day{data?.streak !== 1 && "s"}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold">TOTAL ATTEMPTS</p>
              <h3 className="text-2xl font-black text-white mt-1">{data?.history.length} Mock{data?.history.length !== 1 && "s"}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold">AVERAGE SCORE</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {hasHistory
                  ? `${(data.history.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.history.length).toFixed(1)}/10`
                  : "N/A"
                }
              </h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold">FOCUS CATEGORIES</p>
              <h3 className="text-lg font-black text-white mt-1.5 truncate">
                {data?.weakTopics && data.weakTopics.length > 0
                  ? data.weakTopics.slice(0, 2).join(", ")
                  : "None! Good Job"
                }
              </h3>
            </div>
          </div>
        </section>

        {/* Radar Chart & Details Grid */}
        <section className="grid lg:grid-cols-5 gap-6 mb-8">
          
          {/* Skill Radar Panel */}
          <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col min-h-[350px]">
            <h3 className="text-sm font-bold text-zinc-400 mb-6 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Skill Matrix Overview</span>
            </h3>

            <div className="flex-grow flex items-center justify-center">
              {mounted && data?.skills && data.skills.some((s) => s.score > 0) ? (
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.skills}>
                      <PolarGrid stroke={customRadarColors.grid} />
                      <PolarAngleAxis
                        dataKey="subject"
                        stroke={customRadarColors.text}
                        fontSize={10}
                        fontWeight="bold"
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke={customRadarColors.grid}
                        tick={{ fill: customRadarColors.text, fontSize: 8 }}
                      />
                      <Radar
                        name="Candidate"
                        dataKey="score"
                        stroke={customRadarColors.stroke}
                        fill={customRadarColors.fill}
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                    <Target className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">No Interview Data Recorded</h4>
                  <p className="text-xs text-zinc-500 max-w-[250px] mx-auto mt-2 leading-relaxed">
                    Complete your first technical practice interview to generate your radar skillset outline!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Placement Recommendations */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <span>Practice Insights</span>
              </h3>

              <div className="space-y-4 mt-6">
                {data?.weakTopics && data.weakTopics.length > 0 ? (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Target weak topics</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Your performance is lowest in <span className="font-semibold text-zinc-200">{data.weakTopics.join(", ")}</span>. Generate custom interviews in these roles to boost your score.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">All Tracks Stabilized</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Excellent work! All interview segments meet standard placement benchmarks (above 65%). Maintain your daily streak!
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-4 flex gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Fresher Tip</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Recruiters love visual evidence. Add bookmarked questions and their solutions to your resume references or share your stats dashboard link to stand out!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800/60">
              <Link href="/interview/new" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <span>Configure custom interview options</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* History and Bookmarks Switcher */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex border-b border-zinc-850 mb-6 gap-6">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 text-sm font-semibold relative transition-colors ${
                activeTab === "history" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Session History</span>
              </span>
              {activeTab === "history" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`pb-4 text-sm font-semibold relative transition-colors ${
                activeTab === "bookmarks" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <span>Bookmarked Questions ({data?.bookmarks.length || 0})</span>
              </span>
              {activeTab === "bookmarks" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activeTab === "history" ? (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-4"
              >
                {hasHistory ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800/50 text-zinc-500">
                          <th className="pb-3 font-semibold">Track Role</th>
                          <th className="pb-3 font-semibold">Difficulty</th>
                          <th className="pb-3 font-semibold">Date Completed</th>
                          <th className="pb-3 font-semibold">Score</th>
                          <th className="pb-3 font-semibold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.history.map((attempt) => (
                          <tr key={attempt.id} className="border-b border-zinc-900 group">
                            <td className="py-4 font-bold text-white capitalize">
                              {attempt.type}
                            </td>
                            <td className="py-4 font-medium text-zinc-400 capitalize">
                              {attempt.difficulty}
                            </td>
                            <td className="py-4 text-zinc-500 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{attempt.date}</span>
                            </td>
                            <td className="py-4">
                              {attempt.score !== null ? (
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${
                                  attempt.score >= 8 
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : attempt.score >= 5
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}>
                                  {attempt.score}/10
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs italic">Incomplete</span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => router.push(`/interview/${attempt.id}/feedback`)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:underline transition-all"
                              >
                                <span>Review Feedback</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                      <History className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-300">No Attempts Recorded Yet</h4>
                    <p className="text-xs text-zinc-500 max-w-[280px] mx-auto mt-2 leading-relaxed">
                      You haven't taken any interviews. Launch a new practice mock to kick things off!
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="bookmarks-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-4"
              >
                {data?.bookmarks && data.bookmarks.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.bookmarks.map((bookmark) => (
                      <div
                        key={bookmark.id}
                        onClick={() => setSelectedBookmark(bookmark)}
                        className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 cursor-pointer flex flex-col justify-between group transition-colors shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider capitalize bg-indigo-500/10 px-2 py-0.5 rounded">
                              {bookmark.type} • {bookmark.difficulty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(bookmark.id);
                              }}
                              className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                              title="Remove bookmark"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                            {bookmark.questionText}
                          </p>
                          <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                            {bookmark.studentAnswer || "[Empty Answer]"}
                          </p>
                        </div>

                        <div className="mt-6 pt-3 border-t border-zinc-800/60 flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
                          <span>Practice date: {bookmark.date}</span>
                          <span className="text-indigo-400 group-hover:underline flex items-center gap-0.5">
                            <span>Open details</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-300">No Bookmarks Saved</h4>
                    <p className="text-xs text-zinc-500 max-w-[280px] mx-auto mt-2 leading-relaxed">
                      Bookmark challenging questions during your interview summaries to review them here later.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Bookmark Detail Overlay Modal */}
      <AnimatePresence>
        {selectedBookmark && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 relative max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <button
                onClick={() => setSelectedBookmark(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-850 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest capitalize bg-indigo-500/10 px-2 py-0.5 rounded">
                  {selectedBookmark.type} • {selectedBookmark.difficulty}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2 leading-snug">
                  {selectedBookmark.questionText}
                </h3>
              </div>

              <div className="space-y-4 my-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Response</h4>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-xl leading-relaxed border border-zinc-800/60 max-h-[120px] overflow-y-auto font-medium">
                    {selectedBookmark.studentAnswer || "[No answer submitted]"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">AI Feedback</h4>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-xl leading-relaxed border border-zinc-800/60 font-medium">
                    {selectedBookmark.aiFeedback || "N/A"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Ideal Model Answer</h4>
                  <p className="text-xs text-indigo-200 bg-indigo-950/20 border border-indigo-950 p-4 rounded-xl leading-relaxed font-medium">
                    {selectedBookmark.idealAnswer || "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
