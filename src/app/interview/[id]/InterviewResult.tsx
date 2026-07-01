"use client";

/**
 * NEXHIRE — Interview Result Page
 * File: app/interviews/[id]/result/page.tsx  (or drop anywhere as a Client Component)
 *
 * Prerequisites:
 *   npm install recharts lucide-react
 *
 * API shape expected from GET /api/interviews/[id]/result:
 *   InterviewResultResponse  (see src/types/interview.ts)
 *
 * Replace every  TODO  comment with your real import / value.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Play,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Clock,
  Building2,
  BarChart3,
  Calendar,
  Award,
  Brain,
} from "lucide-react";

// ─── Types (mirrors src/types/interview.ts) ───────────────────────────────────

type HiringRecommendation = "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
type GrowthTrend = "Increasing" | "Stable" | "Decreasing";

interface QuestionEvaluation {
  score: number;
  technicalAccuracy: number;
  depthOfKnowledge: number;
  communication: number;
  practicalThinking: number;
  bestPractices: number;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: HiringRecommendation;
  feedback: string;
  idealAnswer: string;
  topicsToImprove: string[];
}

interface QuestionWithEvaluation {
  id: string;
  question: string;
  answer: string | null;
  evaluation: QuestionEvaluation | null;
  order: number;
}

interface InterviewAnalytics {
  overallScore: number;
  technicalAccuracy: number;
  depthOfKnowledge: number;
  communication: number;
  practicalThinking: number;
  bestPractices: number;
  growthTrend: GrowthTrend;
  interviewLevel: string;
  estimatedCompanyLevel: string;
  hiringProbability: number;
  salaryReadiness: number;
  durationTaken: string;
}

interface InterviewRecommendation {
  overall: HiringRecommendation;
  allStrengths: string[];
  allWeaknesses: string[];
  allTopicsToImprove: string[];
  nextLearningPath: string[];
}

interface InterviewResultResponse {
  interview: {
    id: string;
    type: string;
    difficulty: string;
    targetCompany: string | null;
    duration: number;
    createdAt: string;
    completedAt: string | null;
    status: string;
  };
  analytics: InterviewAnalytics;
  recommendation: InterviewRecommendation;
  questions: QuestionWithEvaluation[];
}

// ─── Company logos (SVG initials fallback — swap for real <img> if you have them) ──

const COMPANY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  google:    { bg: "#1a1f2e", text: "#4285F4", border: "#1E3A5F" },
  amazon:    { bg: "#1f1a0f", text: "#FF9900", border: "#5a3a00" },
  microsoft: { bg: "#0f1a1f", text: "#00A4EF", border: "#005a80" },
  meta:      { bg: "#0f1525", text: "#0866FF", border: "#0a3a8a" },
  netflix:   { bg: "#1f0f0f", text: "#E50914", border: "#8a0009" },
  apple:     { bg: "#1a1a1a", text: "#A8A8A8", border: "#444" },
  openai:    { bg: "#0f1f1a", text: "#10B981", border: "#065f46" },
};

function CompanyBadge({ company }: { company: string }) {
  const key = company.toLowerCase().replace(/\s/g, "");
  const style = COMPANY_COLORS[key] ?? { bg: "#18181B", text: "#A1A1AA", border: "#27272A" };
  const initials = company.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold"
      style={{ background: style.bg, color: style.text, borderColor: style.border }}
    >
      <span className="font-bold">{initials}</span>
      <span>{company}</span>
    </div>
  );
}

// ─── Hiring recommendation styles ─────────────────────────────────────────────

const HIRE_META: Record<HiringRecommendation, {
  bg: string; text: string; border: string; stars: number; tagline: string;
}> = {
  "Strong Hire": {
    bg: "#052E16", text: "#10B981", border: "#166534", stars: 5,
    tagline: "Exceptional candidate. Ready for senior-level roles.",
  },
  Hire: {
    bg: "#0C1A3A", text: "#3B82F6", border: "#1E3A5F", stars: 4,
    tagline: "Solid performance across all categories.",
  },
  "Weak Hire": {
    bg: "#1C1300", text: "#F59E0B", border: "#78350F", stars: 2,
    tagline: "Shows potential. Some key gaps to address.",
  },
  "No Hire": {
    bg: "#1F0000", text: "#EF4444", border: "#7F1D1D", stars: 1,
    tagline: "Significant gaps. More preparation recommended.",
  },
};

function HireBadge({ rec, size = "md" }: { rec: HiringRecommendation; size?: "sm" | "md" }) {
  const m = HIRE_META[rec];
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${pad}`}
      style={{ background: m.bg, color: m.text, borderColor: m.border }}
    >
      <Star className="w-3 h-3 fill-current" />
      {rec}
    </span>
  );
}

// ─── Score display helpers ────────────────────────────────────────────────────

/** Converts a 0–10 score to "XX / 100" display */
function fmt(score: number): string {
  return `${Math.round(score * 10)} / 100`;
}

function pctNum(score: number): number {
  return Math.round(score * 10);
}

function scoreColor(score: number): string {
  if (score >= 8.5) return "#10B981";
  if (score >= 7)   return "#3B82F6";
  if (score >= 5.5) return "#F59E0B";
  return "#EF4444";
}

function scorePercentile(score: number): string {
  if (score >= 9.5) return "Top 2%";
  if (score >= 9.0) return "Top 5%";
  if (score >= 8.5) return "Top 10%";
  if (score >= 8.0) return "Top 20%";
  if (score >= 7.0) return "Top 35%";
  if (score >= 6.0) return "Top 50%";
  return "Bottom 50%";
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function Ring({
  score, size = 80, stroke = 6, color,
}: { score: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(score, 10) / 10) * c;
  const col = color ?? scoreColor(score);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272A" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col}
          strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-white" style={{ fontSize: size * 0.2 }}>
          {pctNum(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function Bar({ score, color }: { score: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#27272A" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pctNum(score)}%`, background: color ?? scoreColor(score) }}
      />
    </div>
  );
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

function SkillRadar({ analytics }: { analytics: InterviewAnalytics }) {
  const data = [
    { axis: "Technical",    value: pctNum(analytics.technicalAccuracy) },
    { axis: "Depth",        value: pctNum(analytics.depthOfKnowledge) },
    { axis: "Communication",value: pctNum(analytics.communication) },
    { axis: "Practical",   value: pctNum(analytics.practicalThinking) },
    { axis: "Best Practices",value: pctNum(analytics.bestPractices) },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#27272A" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#71717A", fontSize: 11 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E4E4E7" }}
          itemStyle={{ color: "#3B82F6" }}
          formatter={(value) => [`${Number(value) / 100}`, "Score"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Company benchmark card ───────────────────────────────────────────────────

const COMPANY_BENCHMARKS: Record<string, number> = {
  google: 82, amazon: 79, microsoft: 80, meta: 83,
  netflix: 85, apple: 84, openai: 86,
};

function CompanyBenchmark({
  overallScore, targetCompany,
}: { overallScore: number; targetCompany: string | null }) {
  const key = targetCompany?.toLowerCase() ?? "";
  const benchmark = COMPANY_BENCHMARKS[key] ?? 78;
  const userScore = pctNum(overallScore);
  const diff = userScore - benchmark;
  const companies = Object.entries(COMPANY_BENCHMARKS).slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* You vs company */}
      <div className="flex items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-12 rounded-t-lg transition-all duration-700"
            style={{ height: `${benchmark * 0.7}px`, background: "#27272A" }}
          />
          <span className="text-xs text-zinc-500">{targetCompany ?? "Industry"}</span>
          <span className="text-sm font-semibold text-zinc-400">{benchmark}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-12 rounded-t-lg transition-all duration-700"
            style={{ height: `${userScore * 0.7}px`, background: "#3B82F6" }}
          />
          <span className="text-xs text-zinc-400">You</span>
          <span className="text-sm font-semibold text-white">{userScore}</span>
        </div>
      </div>

      {/* Delta badge */}
      <div className="flex items-center gap-2">
        {diff >= 0 ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> +{diff} above benchmark
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950 border border-amber-900 px-2.5 py-1 rounded-full">
            <TrendingDown className="w-3 h-3" /> {diff} below benchmark
          </span>
        )}
        <span className="text-xs text-zinc-500">{scorePercentile(overallScore)}</span>
      </div>

      {/* All companies mini */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">All companies</span>
        {companies.map(([co, avg]) => (
          <div key={co} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-20 capitalize">{co}</span>
            <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-600" style={{ width: `${avg}%` }} />
            </div>
            <span className="text-xs text-zinc-400 w-6 text-right">{avg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Confidence card ───────────────────────────────────────────────────────

function AIConfidence({ score, questionCount }: { score: number; questionCount: number }) {
  // Confidence scales with score quality and number of questions answered
  const confidence = Math.min(98, Math.round(60 + score * 3 + questionCount * 0.8));
  const label =
    confidence >= 90 ? "AI is highly confident this evaluation reflects your actual skill level." :
    confidence >= 75 ? "AI has moderate confidence. Answer more questions to improve accuracy." :
    "Confidence is limited. Try a longer session for a more accurate picture.";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {confidence}%
        </span>
        <span className="text-sm text-zinc-500 mb-1">confidence</span>
      </div>
      <Bar score={confidence / 10} color="#8B5CF6" />
      <p className="text-xs text-zinc-400 leading-relaxed">{label}</p>
      <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
        <Brain className="w-3 h-3" />
        Based on {questionCount} answers · Gemini AI
      </div>
    </div>
  );
}

// ─── Learning roadmap ─────────────────────────────────────────────────────────

const WEEK_TIMES: Record<number, string> = { 1: "6 hrs", 2: "8 hrs", 3: "6 hrs", 4: "5 hrs" };

function LearningRoadmap({ topics }: { topics: string[] }) {
  const weeks: string[][] = [[], [], [], []];
  topics.forEach((t, i) => weeks[i % 4].push(t));

  return (
    <div className="flex flex-col gap-3">
      {weeks.map((items, wi) =>
        items.length === 0 ? null : (
          <div key={wi} className="flex gap-3">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-400">
                {wi + 1}
              </div>
              {wi < 3 && items.length > 0 && (
                <div className="w-px flex-1 bg-zinc-800" style={{ minHeight: 12 }} />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Week {wi + 1}</span>
                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {WEEK_TIMES[wi + 1]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-full border"
                    style={{
                      background: wi === 0 ? "#1C1C28" : "#0F0F18",
                      borderColor: wi === 0 ? "#3B4060" : "#27272A",
                      color: wi === 0 ? "#8B9CF6" : "#71717A",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── AI Recruiter notes ───────────────────────────────────────────────────────

function RecruiterNotes({
  analytics, recommendation, interviewType,
}: {
  analytics: InterviewAnalytics;
  recommendation: InterviewRecommendation;
  interviewType: string;
}) {
  const notes = [
    recommendation.allStrengths[0] && `Candidate demonstrates ${recommendation.allStrengths[0].toLowerCase()}.`,
    recommendation.allStrengths[1] && `Shows ${recommendation.allStrengths[1].toLowerCase()}.`,
    recommendation.allWeaknesses[0] && `Needs improvement in ${recommendation.allWeaknesses[0].toLowerCase()}.`,
    `Recommended for ${analytics.estimatedCompanyLevel} interviews.`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <span className="text-[9px] font-bold text-zinc-400">HR</span>
        </div>
        <div>
          <span className="text-xs font-medium text-white">AI Recruiter · {interviewType}</span>
          <span className="text-[10px] text-zinc-600 ml-2">Confidential evaluation</span>
        </div>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
        {notes.map((note, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
            <span className="text-zinc-600 flex-shrink-0 mt-0.5">—</span>
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Salary estimate ──────────────────────────────────────────────────────────

function SalaryEstimate({ analytics }: { analytics: InterviewAnalytics }) {
  const levelRanges: Record<string, { inr: string; usd: string }> = {
    Entry:  { inr: "₹4–8 LPA",   usd: "$60–80K" },
    Junior: { inr: "₹8–14 LPA",  usd: "$85–110K" },
    Mid:    { inr: "₹14–25 LPA", usd: "$110–150K" },
    Senior: { inr: "₹25–50 LPA", usd: "$150–220K" },
  };
  const range = levelRanges[analytics.interviewLevel] ?? levelRanges.Junior;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Current level</span>
          <span className="text-sm font-semibold text-white">{analytics.interviewLevel} Developer</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Salary readiness</span>
          <span className="text-sm font-semibold text-emerald-400">{analytics.salaryReadiness}%</span>
        </div>
      </div>
      <Bar score={analytics.salaryReadiness / 10} color="#10B981" />
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
        <span className="text-[10px] text-zinc-600 block mb-1">Estimated market salary</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {range.inr}
          </span>
          <span className="text-xs text-zinc-600">· {range.usd}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
        <Zap className="w-3 h-3" />
        Based on {analytics.interviewLevel} level · {analytics.estimatedCompanyLevel} benchmark
      </div>
    </div>
  );
}

// ─── Question accordion ───────────────────────────────────────────────────────

function QuestionRow({ qw, index }: { qw: QuestionWithEvaluation; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const e = qw.evaluation;

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden transition-colors hover:border-zinc-700">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span className="w-6 h-6 flex-shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-400">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-zinc-300 line-clamp-1">{qw.question}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {e && (
            <>
              <span className="text-xs font-bold" style={{ color: scoreColor(e.score) }}>
                {fmt(e.score)}
              </span>
              <HireBadge rec={e.hiringRecommendation} size="sm" />
            </>
          )}
          {open
            ? <ChevronUp className="w-4 h-4 text-zinc-600" />
            : <ChevronDown className="w-4 h-4 text-zinc-600" />
          }
        </div>
      </button>

      {open && e && (
        <div className="border-t border-zinc-800">
          {/* Per-question rubric mini bars */}
          <div className="grid grid-cols-5 gap-3 p-4 border-b border-zinc-800">
            {([
              ["Technical", e.technicalAccuracy, "#3B82F6"],
              ["Depth", e.depthOfKnowledge, "#8B5CF6"],
              ["Comms", e.communication, "#3B82F6"],
              ["Practical", e.practicalThinking, "#10B981"],
              ["Practices", e.bestPractices, "#F59E0B"],
            ] as [string, number, string][]).map(([label, val, col]) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-zinc-600 text-center">{label}</span>
                <span className="text-sm font-bold" style={{ color: col }}>{val}</span>
                <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${val * 10}%`, background: col }} />
                </div>
              </div>
            ))}
          </div>

          {/* Q → A → Feedback → Ideal */}
          <div className="flex flex-col gap-4 p-4">
            {/* Answer */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="w-7 h-7 rounded-full bg-violet-950 border border-violet-800 flex items-center justify-center text-[10px] font-bold text-violet-400">A</span>
                <div className="w-px flex-1 bg-zinc-800 min-h-[8px]" />
              </div>
              <div className="flex-1 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block mb-1.5">Your answer</span>
                <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  {qw.answer ?? <span className="text-zinc-600 italic">No answer recorded</span>}
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-400">AI</span>
                <div className="w-px flex-1 bg-zinc-800 min-h-[8px]" />
              </div>
              <div className="flex-1 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block mb-1.5">
                  AI feedback · <span style={{ color: scoreColor(e.score) }}>{fmt(e.score)}</span>
                </span>
                <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  {e.feedback}
                </div>
              </div>
            </div>

            {/* Ideal answer */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <span className="w-7 h-7 rounded-full bg-violet-950 border border-violet-800 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block mb-1.5">Ideal answer</span>
                <div className="text-xs text-emerald-300 leading-relaxed bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-3">
                  {e.idealAnswer}
                </div>
              </div>
            </div>
          </div>

          {/* Strengths / Weaknesses / Topics for this question */}
          {(e.strengths.length > 0 || e.weaknesses.length > 0 || e.topicsToImprove.length > 0) && (
            <div className="grid grid-cols-3 gap-4 p-4 pt-0">
              {e.strengths.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-700 block mb-2">Strengths</span>
                  {e.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-400 mb-1 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                      {s}
                    </div>
                  ))}
                </div>
              )}
              {e.weaknesses.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-red-700 block mb-2">Weaknesses</span>
                  {e.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-400 mb-1 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
              {e.topicsToImprove.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-violet-700 block mb-2">Topics to improve</span>
                  <div className="flex flex-wrap gap-1">
                    {e.topicsToImprove.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090B] p-6 flex flex-col gap-5">
      <Skeleton className="h-28" />
      <div className="grid grid-cols-4 gap-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      <div className="grid grid-cols-3 gap-3"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      <div className="grid grid-cols-3 gap-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      <Skeleton className="h-72" />
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  children, className = "", accent,
}: { children: React.ReactNode; className?: string; accent?: string }) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl ${className}`}
      style={accent ? { borderTop: `2px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, title, color = "#3B82F6" }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color }}>{icon}</span>
      <span className="text-sm font-medium text-zinc-400">{title}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InterviewResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<InterviewResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/interviews/${id}/result`)
      .then(res => {
        if (res.status === 401) { router.push("/auth"); return null; }
        if (!res.ok) throw new Error("Interview not found");
        return res.json();
      })
      .then(json => json && setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400 text-sm">{error ?? "Interview not found"}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-400 text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { interview, analytics, recommendation, questions } = data;
  const hMeta = HIRE_META[recommendation.overall];
  const date = new Date(interview.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-300" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sticky topbar ── */}
      <header className="sticky top-0 z-20 bg-[#09090B]/95 backdrop-blur-sm border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/dashboard/history" className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> History
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{interview.type} · {date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Completed
          </span>
          <button className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-6 flex flex-col gap-5">

        {/* ── 1. Report header ── */}
        <Card className="p-6 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-blue-950 text-blue-400 border border-blue-900 rounded-full px-3 py-1 text-xs">
                <Sparkles className="w-3 h-3" /> AI Evaluation Report
              </span>
              {interview.targetCompany && <CompanyBadge company={interview.targetCompany} />}
            </div>
            <h1
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {interview.type} Interview
            </h1>
            <p className="text-sm text-zinc-500 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{interview.targetCompany ?? "General"}</span>
              <span>·</span>
              <span>{interview.difficulty} difficulty</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{analytics.durationTaken}</span>
              <span>·</span>
              <span>{questions.length} questions</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{date}</span>
            </p>
          </div>
          <div className="flex items-start gap-2 flex-shrink-0">
            <Link href={`/dashboard/interviews/${id}/retry`}
              className="flex items-center gap-1.5 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Link>
            <Link href="/dashboard/interviews/new"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl px-3 py-2 text-xs text-white font-medium transition-colors">
              <Play className="w-3.5 h-3.5" /> New interview
            </Link>
          </div>
        </Card>

        {/* ── 2. Top metric row (4 cards) ── */}
        <div className="grid grid-cols-4 gap-3">

          {/* AI Score — "91 / 100 · Top 5%" */}
          <Card accent="#3B82F6" className="p-5 flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">AI interview score</span>
            <div className="flex items-end gap-2">
              <span
                className="text-4xl font-bold leading-none"
                style={{ color: scoreColor(analytics.overallScore), fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {pctNum(analytics.overallScore)}
              </span>
              <span className="text-lg text-zinc-600 mb-0.5">/ 100</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded-full w-fit">
              <Award className="w-3 h-3" /> {scorePercentile(analytics.overallScore)}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="font-medium capitalize" style={{ color: analytics.growthTrend === "Increasing" ? "#10B981" : analytics.growthTrend === "Decreasing" ? "#EF4444" : "#71717A" }}>
                {analytics.growthTrend === "Increasing" && <TrendingUp className="w-3.5 h-3.5 inline mr-1" />}
                {analytics.growthTrend === "Decreasing" && <TrendingDown className="w-3.5 h-3.5 inline mr-1" />}
                {analytics.growthTrend === "Stable" && <Minus className="w-3.5 h-3.5 inline mr-1" />}
                {analytics.growthTrend} trend
              </span>
              <span>across session</span>
            </div>
          </Card>

          {/* Hiring recommendation */}
          <Card accent="#10B981" className="p-5 flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Hiring recommendation</span>
            <HireBadge rec={recommendation.overall} />
            <p className="text-xs leading-relaxed" style={{ color: hMeta.text }}>{hMeta.tagline}</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className="w-3.5 h-3.5"
                  style={{ color: n <= hMeta.stars ? "#F59E0B" : "#27272A", fill: n <= hMeta.stars ? "#F59E0B" : "none" }}
                />
              ))}
            </div>
          </Card>

          {/* Level & company level */}
          <Card accent="#8B5CF6" className="p-5 flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Estimated level</span>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {analytics.interviewLevel}
            </span>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-600 block mb-0.5">Estimated company level</span>
              <span className="text-sm font-semibold text-violet-400">{analytics.estimatedCompanyLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Trophy className="w-3 h-3" /> Based on Gemini evaluation
            </div>
          </Card>

          {/* Hiring probability */}
          <Card accent="#F59E0B" className="p-5 flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Hiring probability</span>
            <div className="flex items-center gap-3">
              <Ring score={analytics.hiringProbability / 10} size={64} stroke={5} color="#F59E0B" />
              <div>
                <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {analytics.hiringProbability}%
                </span>
                <span className="text-xs text-zinc-600 block">chance of hire</span>
              </div>
            </div>
            <Bar score={analytics.hiringProbability / 10} color="#F59E0B" />
          </Card>
        </div>

        {/* ── 3. Radar + Company benchmark + AI confidence ── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-5">
            <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Skill radar" />
            <SkillRadar analytics={analytics} />
          </Card>

          <Card className="p-5">
            <CardHeader icon={<Target className="w-4 h-4" />} title="Company benchmark" />
            <CompanyBenchmark overallScore={analytics.overallScore} targetCompany={interview.targetCompany} />
          </Card>

          <Card className="p-5">
            <CardHeader icon={<Brain className="w-4 h-4" />} title="AI confidence" color="#8B5CF6" />
            <AIConfidence score={analytics.overallScore} questionCount={questions.length} />
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <CardHeader icon={<Zap className="w-4 h-4" />} title="Salary estimate" color="#10B981" />
              <SalaryEstimate analytics={analytics} />
            </div>
          </Card>
        </div>

        {/* ── 4. Rubric bars + Recruiter notes ── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-5">
            <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Evaluation rubric" />
            {([
              ["Technical accuracy",  analytics.technicalAccuracy,  "#3B82F6"],
              ["Depth of knowledge",  analytics.depthOfKnowledge,   "#8B5CF6"],
              ["Communication",       analytics.communication,       "#3B82F6"],
              ["Practical thinking",  analytics.practicalThinking,   "#10B981"],
              ["Best practices",      analytics.bestPractices,       "#F59E0B"],
            ] as [string, number, string][]).map(([label, val, col]) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-zinc-400">{label}</span>
                  <span className="text-xs font-semibold" style={{ color: col }}>{fmt(val)}</span>
                </div>
                <Bar score={val} color={col} />
              </div>
            ))}
          </Card>

          <Card className="p-5">
            <CardHeader icon={<Award className="w-4 h-4" />} title="AI recruiter notes" color="#10B981" />
            <RecruiterNotes
              analytics={analytics}
              recommendation={recommendation}
              interviewType={interview.type}
            />

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <CardHeader icon={<BookOpen className="w-4 h-4" />} title="AI learning roadmap" color="#8B5CF6" />
              <LearningRoadmap topics={recommendation.nextLearningPath} />
            </div>
          </Card>
        </div>

        {/* ── 5. Strengths / Weaknesses / Topics ── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-5">
            <CardHeader icon={<ThumbsUp className="w-4 h-4" />} title="Strengths" color="#10B981" />
            <div className="flex flex-col gap-2">
              {recommendation.allStrengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                  {s}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader icon={<ThumbsDown className="w-4 h-4" />} title="Weaknesses" color="#EF4444" />
            <div className="flex flex-col gap-2">
              {recommendation.allWeaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                  {w}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader icon={<BookOpen className="w-4 h-4" />} title="Topics to improve" color="#8B5CF6" />
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recommendation.allTopicsToImprove.map((t, i) => (
                <span key={i}
                  className="text-[11px] px-2.5 py-1 rounded-full border"
                  style={{
                    background: i % 3 === 0 ? "#1C1300" : "#1C1C28",
                    borderColor: i % 3 === 0 ? "#78350F" : "#3B4060",
                    color: i % 3 === 0 ? "#F59E0B" : "#8B9CF6",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] text-zinc-600 block mb-1">AI recommendation</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Focus this week on{" "}
                <span className="text-violet-400 font-medium">
                  {recommendation.nextLearningPath.slice(0, 2).join(" & ")}
                </span>
                . Both are high-frequency in{" "}
                {interview.targetCompany ?? "FAANG"} rounds.
              </p>
            </div>
          </Card>
        </div>

        {/* ── 6. Per-question accordion timeline ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Interview timeline
            </div>
            <span className="text-xs text-zinc-600">{questions.length} questions · click to expand</span>
          </div>
          <div className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <QuestionRow key={q.id} qw={q} index={i} />
            ))}
          </div>
        </section>

        {/* ── Bottom action bar ── */}
        <div className="flex items-center justify-between py-4">
          <Link href="/dashboard/history"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to history
          </Link>
          <div className="flex gap-2">
            <Link href={`/dashboard/interviews/${id}/retry`}
              className="flex items-center gap-1.5 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              <RefreshCw className="w-4 h-4" /> Retry this interview
            </Link>
            <Link href="/dashboard/interviews/new"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2 text-sm text-white font-medium transition-colors">
              <Play className="w-4 h-4" /> New interview
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}