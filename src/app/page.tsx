"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  ArrowRight, Sparkles, Flame, Cpu, 
  Bookmark, BarChart3, Zap, ShieldCheck 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  const { data: session } = useSession();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  const featureCards = [
    {
      icon: <Cpu className="h-6 w-6 text-indigo-400" />,
      title: "AI Interviewer",
      desc: "Receive context-aware, customized questions that simulate a real technical panel based on your target role."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-emerald-400" />,
      title: "Detailed Skill Metrics",
      desc: "Visualize your strengths and weaknesses in Frontend, Backend, Fullstack, DSA, and HR behavioral questions."
    },
    {
      icon: <Flame className="h-6 w-6 text-orange-400" />,
      title: "Daily Practice Streak",
      desc: "Build consistency and discipline for job hunting. Complete interviews daily to maintain your placement momentum."
    },
    {
      icon: <Bookmark className="h-6 w-6 text-blue-400" />,
      title: "Bookmark & Review",
      desc: "Save challenging questions and AI ideal answers to your personal vault for quick cramming sessions."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />

      {/* Grid Pattern Background & Ambient Glow */}
      <div className="relative flex-grow grid-bg radial-light flex flex-col justify-center items-center py-16 px-6 overflow-hidden">
        {/* Subtle decorative orb */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl w-full text-center z-10 flex flex-col items-center"
        >
          {/* Animated Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/35 bg-indigo-500/5 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>AI Mock Placement Prep for Students</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent"
          >
            Nail Your Internship Interviews <br />
            With <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-500 bg-clip-text text-transparent">AI Feedback</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Generate role-based mock interviews, practice voice or written responses, and receive constructive code reviews instantly.
          </motion.p>

          {/* Action CTA */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href={session ? "/dashboard" : "/auth"}
              className="btn-primary flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white transition-all w-full sm:w-auto justify-center"
            >
              <span>{session ? "Enter Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-8 py-4 text-base font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all w-full sm:w-auto justify-center"
            >
              <span>Learn More</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid Section */}
        <section id="features" className="max-w-6xl w-full mt-32 z-10">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
              Engineered for Aspiring Developers
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Everything you need to level up your resume, knowledge, and interviewing confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featureCards.map((feat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glow-card rounded-2xl p-8 text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors shadow-inner">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Explore detail</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dynamic Mock Interview Category Icons */}
        <section className="max-w-6xl w-full mt-32 mb-16 text-center z-10">
          <h3 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase mb-8">
            Available Tracks
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["Frontend Development", "Backend Development", "Full-Stack Engineer", "Data Structures & Algos", "HR & Behavioral"].map((track, i) => (
              <div key={i} className="rounded-full bg-zinc-900/60 border border-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-300 shadow-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                {track}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-6xl border-t border-zinc-900 mt-24 pt-8 pb-4 text-center z-10 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} InterviewMate. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-400 cursor-pointer">Terms</span>
            <span className="hover:text-zinc-400 cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-400 cursor-pointer">GitHub</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
