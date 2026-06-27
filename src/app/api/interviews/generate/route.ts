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

    const { type, difficulty, resumeText } = await req.json();

    if (!type || !difficulty) {
      return NextResponse.json(
        { error: "Type and difficulty are required" },
        { status: 400 }
      );
    }

    // Generate 5 questions via Gemini / Local Mock
    const questions = await generateInterviewQuestions(type, difficulty, resumeText);

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
