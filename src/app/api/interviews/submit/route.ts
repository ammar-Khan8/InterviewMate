import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { evaluateAnswers } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, answers } = await req.json();

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Session ID and answers are required" },
        { status: 400 }
      );
    }

    // Fetch the session and check ownership
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    if (interviewSession.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Map answers by question ID
    const answersMap = new Map<string, string>();
    answers.forEach((ans: any) => {
      answersMap.set(ans.questionId, ans.answer || "");
    });

    // Prepare pairs for evaluation
    const qaPairs = interviewSession.questions.map((q) => ({
      question: q.questionText,
      answer: answersMap.get(q.id) || "",
    }));

    // Evaluate answers
    const evaluations = await evaluateAnswers(
      interviewSession.type,
      interviewSession.difficulty,
      qaPairs
    );

    // Update each question attempt
    let totalScore = 0;
    for (let i = 0; i < interviewSession.questions.length; i++) {
      const q = interviewSession.questions[i];
      const evalItem = evaluations[i];
      const ansText = answersMap.get(q.id) || "";

      totalScore += evalItem.score;

      await prisma.questionAttempt.update({
        where: { id: q.id },
        data: {
          studentAnswer: ansText,
          aiScore: evalItem.score,
          aiFeedback: evalItem.feedback,
          idealAnswer: evalItem.idealAnswer,
        },
      });
    }

    const overallScore = totalScore / interviewSession.questions.length;
    
    // Create elegant general summary feedback
    let overallFeedback = "Excellent job! You have demonstrated key capabilities.";
    if (overallScore < 5) {
      overallFeedback = "You need more preparation on these topics. Focus on explaining core architectures, definition terms, and practicing coding logic.";
    } else if (overallScore < 8) {
      overallFeedback = "Solid performance. You have a good grasp of intermediate topics, but should provide deeper explanations and real-world trade-offs in your answers.";
    }

    // Update session
    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        score: overallScore,
        feedback: overallFeedback,
      },
      include: {
        questions: true,
      },
    });

    // Update streak for user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const now = new Date();
      let newStreak = user.streak;

      if (!user.lastPracticeDate) {
        newStreak = 1;
      } else {
        const lastPractice = new Date(user.lastPracticeDate);
        
        // Calculate difference in days between lastPractice and now (midnight local)
        const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const d2 = new Date(lastPractice.getFullYear(), lastPractice.getMonth(), lastPractice.getDate());
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Practiced yesterday, increment streak
          newStreak += 1;
        } else if (diffDays > 1) {
          // Broke streak, reset to 1
          newStreak = 1;
        }
        // If diffDays === 0, practiced today, streak remains the same
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          streak: newStreak,
          lastPracticeDate: now,
        },
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error("Submit interview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
