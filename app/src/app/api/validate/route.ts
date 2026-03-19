import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter: IP → { count, resetAt }
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  if (entry.count > 10) return true;
  return false;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateMap.forEach((entry, ip) => {
    if (now > entry.resetAt) rateMap.delete(ip);
  });
}, 300_000);

function normalize(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, " ");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limited. Try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { answer, question_id, reveal } = body;

    if (!question_id) {
      return NextResponse.json(
        { error: "Missing question_id" },
        { status: 400 }
      );
    }

    const envKey = `CIPHER_ANSWER_${question_id}`;
    const correctAnswer = process.env[envKey];

    if (!correctAnswer) {
      return NextResponse.json(
        { error: "Invalid question_id" },
        { status: 400 }
      );
    }

    if (reveal) {
      return NextResponse.json({ correct: false, answer: correctAnswer });
    }

    if (!answer) {
      return NextResponse.json(
        { error: "Missing answer" },
        { status: 400 }
      );
    }

    const correct = normalize(answer) === normalize(correctAnswer);
    return NextResponse.json({
      correct,
      ...(!correct && { answer: correctAnswer }),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
