import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch user details for streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, name: true, email: true },
    });

    // Fetch all interview attempts
    const attempts = await prisma.interviewSession.findMany({
      where: { userId },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    // Calculate skill scores
    const skillStats: Record<string, { total: number; count: number }> = {
      "frontend": { total: 0, count: 0 },
      "backend": { total: 0, count: 0 },
      "fullstack": { total: 0, count: 0 },
      "dsa": { total: 0, count: 0 },
      "hr": { total: 0, count: 0 },
    };

    attempts.forEach((session) => {
      if (session.score !== null) {
        const type = session.type.toLowerCase();
        if (skillStats[type] !== undefined) {
          skillStats[type].total += session.score;
          skillStats[type].count += 1;
        }
      }
    });

    const skills = Object.keys(skillStats).map((key) => {
      const { total, count } = skillStats[key];
      // Default to 0 if no attempts, scale score to 0-100 (score is out of 10)
      const avg = count > 0 ? Math.round((total / count) * 10) : 0;
      return {
        subject: key.toUpperCase(),
        score: avg,
        fullMark: 100,
      };
    });

    // Extract bookmarked questions
    const bookmarks = await prisma.questionAttempt.findMany({
      where: {
        isBookmarked: true,
        session: {
          userId,
        },
      },
      include: {
        session: {
          select: {
            type: true,
            difficulty: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    // Identify weak areas (average score below 6.5 or 65%)
    const weakTopics = skills
      .filter((s) => s.score > 0 && s.score < 65)
      .map((s) => s.subject);

    // If there are attempts but no category scores are low, list the lowest scoring category
    if (weakTopics.length === 0 && attempts.some((a) => a.score !== null)) {
      const activeSkills = skills.filter((s) => s.score > 0);
      if (activeSkills.length > 0) {
        activeSkills.sort((a, b) => a.score - b.score);
        if (activeSkills[0].score < 80) {
          weakTopics.push(activeSkills[0].subject);
        }
      }
    }

    return NextResponse.json({
      name: user?.name || "Candidate",
      streak: user?.streak || 0,
      skills,
      weakTopics,
      history: attempts.map((a) => ({
        id: a.id,
        type: a.type,
        difficulty: a.difficulty,
        score: a.score !== null ? Number(a.score.toFixed(1)) : null,
        date: a.createdAt.toLocaleDateString(),
        questionCount: a.questions.length,
      })),
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        questionText: b.questionText,
        studentAnswer: b.studentAnswer,
        aiScore: b.aiScore,
        aiFeedback: b.aiFeedback,
        idealAnswer: b.idealAnswer,
        type: b.session.type,
        difficulty: b.session.difficulty,
        date: b.session.createdAt.toLocaleDateString(),
      })),
    });
  } catch (error: any) {
    console.error("Dashboard stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
