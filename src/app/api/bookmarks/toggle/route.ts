import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionAttemptId, isBookmarked } = await req.json();

    if (!questionAttemptId) {
      return NextResponse.json(
        { error: "Question Attempt ID is required" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Verify ownership
    const question = await prisma.questionAttempt.findUnique({
      where: { id: questionAttemptId },
      include: {
        session: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.session.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.questionAttempt.update({
      where: { id: questionAttemptId },
      data: {
        isBookmarked: isBookmarked ?? !question.isBookmarked,
      },
    });

    return NextResponse.json({
      message: "Bookmark toggled successfully",
      isBookmarked: updated.isBookmarked,
    });
  } catch (error: any) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
