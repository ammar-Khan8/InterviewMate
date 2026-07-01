import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestions } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, difficulty, questionCount, resumeText } = await req.json();

    if (!type || !difficulty) {
      return NextResponse.json(
        { error: "Type and difficulty are required" },
        { status: 400 }
      );
    }

    const requestedCount = Number(questionCount) || 5;
    const safeQuestionCount = Math.min(10, Math.max(3, requestedCount));

    // Generate questions via Gemini or a local fallback
    const generatedQuestions = await generateInterviewQuestions(type, difficulty, resumeText, safeQuestionCount);
    const questions = generatedQuestions
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, safeQuestionCount);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No interview questions were generated" },
        { status: 500 }
      );
    }

    // Create session and questions in a transaction
    const dbSession = await prisma.interviewSession.create({
      data: {
        userId: (session.user as any).id,
        type,
        difficulty,
        questions: {
          create: questions.map((text) => ({
            questionText: text,
            studentAnswer: "",
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(dbSession, { status: 201 });
  } catch (error: any) {
    console.error("Generate interview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
