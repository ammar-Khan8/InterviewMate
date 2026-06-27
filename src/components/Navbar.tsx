"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Flame, User, LogOut, Briefcase, Award } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (session) {
      // Fetch stats to get current streak
      fetch("/api/dashboard/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.streak === "number") {
            setStreak(data.streak);
          }
        })
        .catch((err) => console.error("Error loading streak:", err));
    }
  }, [session, pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg shadow-indigo-600/30">
            IM
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            Interview<span className="text-indigo-500">Mate</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "text-indigo-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/interview/new"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/interview/new"
                    ? "text-indigo-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Start Interview
              </Link>

              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/20">
                <Flame className="h-4 w-4 fill-orange-500 animate-pulse" />
                <span>{streak} Day{streak !== 1 && "s"}</span>
              </div>

              {/* User Dropdown Profile mock */}
              <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-zinc-200">
                    {session.user?.name || "Candidate"}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </>
          ) : (
            pathname !== "/auth" && (
              <Link
                href="/auth"
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/25"
              >
                Get Started
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
