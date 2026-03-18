"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { playBeep, playCorrect, playWrong, playStampSlam, playTick, playUrgentTick, playFailure } from "@/lib/sounds";

const AGENT_NAMES = ["SHADOW", "GHOST", "VIPER", "FALCON", "WOLF", "CIPHER"];

const CHOICES = [
  "MEET AT THE PORT",
  "MOVE TO THE SAFE HOUSE",
  "LEAVE FOR KARACHI",
  "FIND THE INFORMANT",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMissionBrief(): { brief: string } {
  const day = new Date().getDay();
  if (day === 1 || day === 2) {
    return {
      brief:
        "Handler Mohammed Aalam has intercepted a transmission near Lyari. Decode it before Major Iqbal's network destroys the evidence.",
    };
  } else if (day === 3 || day === 4) {
    return {
      brief:
        "Director Sanyal has a priority message from deep inside Karachi. The mole has 60 seconds before his cover is blown.",
    };
  }
  return {
    brief:
      "Hamza Ali Mazari needs you. A final transmission has arrived from the Baloch compound. Decrypt it now.",
  };
}

function MissionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");

  const [step, setStep] = useState<"name" | "dossier">("name");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [answerState, setAnswerState] = useState<
    "idle" | "correct" | "wrong" | "failed"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setShuffledChoices(shuffleArray(CHOICES));
  }, []);

  const agentName = selectedName || customName.toUpperCase() || "AGENT";

  const handleConfirmName = async () => {
    const name = selectedName || customName.trim().toUpperCase();
    if (!name) return;
    playBeep();

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: name,
          recruited_by: from || null,
        }),
      });
      const data = await res.json();
      if (data.referral_code) {
        setReferralCode(data.referral_code);
        sessionStorage.setItem("referral_code", data.referral_code);
        sessionStorage.setItem("agent_name", name);
      }
    } catch {
      // Continue even if API fails — don't block flow
    }
    setStep("dossier");
    setTimeout(() => playStampSlam(), 200);
  };

  // Countdown timer with sound
  useEffect(() => {
    if (step !== "dossier") return;
    if (answerState === "correct" || answerState === "failed") return;
    if (timeLeft <= 0) {
      setAnswerState("failed");
      playFailure();
      return;
    }
    if (timeLeft <= 10) {
      playUrgentTick();
    } else if (timeLeft <= 20) {
      playTick();
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [step, timeLeft, answerState]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (isSubmitting || answerState === "correct" || answerState === "failed")
        return;
      setIsSubmitting(true);

      try {
        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer, question_id: 1 }),
        });
        const data = await res.json();

        if (data.correct) {
          setAnswerState("correct");
          playCorrect();
          setTimeout(() => {
            router.push(
              `/game?name=${encodeURIComponent(agentName)}&code=${referralCode}`
            );
          }, 1500);
        } else {
          setAnswerState("wrong");
          playWrong();
          const newAttempts = wrongAttempts + 1;
          setWrongAttempts(newAttempts);
          if (newAttempts >= 3) {
            setAnswerState("failed");
            playFailure();
          } else {
            setTimeout(() => setAnswerState("idle"), 1000);
          }
        }
      } catch {
        setAnswerState("wrong");
        playWrong();
        setTimeout(() => setAnswerState("idle"), 1000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, answerState, wrongAttempts, agentName, referralCode, router]
  );

  const timerColor =
    timeLeft <= 10
      ? "timer-danger"
      : timeLeft <= 20
        ? "timer-amber"
        : "timer-normal";

  const { brief } = getMissionBrief();

  if (step === "name") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-4 bg-terminal-bg">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-terminal-green text-xl font-heading font-bold text-center">
            What do you call yourself, Agent?
          </h1>

          <div className="grid grid-cols-2 gap-3">
            {AGENT_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setSelectedName(name);
                  setCustomName("");
                }}
                className={`min-h-[48px] text-lg font-heading font-bold uppercase tracking-wider transition-all duration-150 border ${
                  selectedName === name
                    ? "bg-terminal-green text-black border-terminal-green"
                    : "bg-transparent text-terminal-dim border-terminal-border hover:border-terminal-green hover:text-terminal-green"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Or enter your own"
              maxLength={20}
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedName(null);
              }}
              className="w-full bg-transparent border border-terminal-border text-terminal-green
                         px-4 py-3 font-mono placeholder:text-terminal-dim/50 focus:outline-none
                         focus:border-terminal-green"
            />
          </div>

          <button
            onClick={handleConfirmName}
            disabled={!selectedName && !customName.trim()}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            CONFIRM IDENTITY
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-terminal-bg">
      <div className="max-w-lg w-full">
        {/* Dossier card */}
        <div className="relative bg-dossier-bg text-dossier-text p-6 md:p-8 border border-dossier-border paper-noise">
          <div className="classified-stamp animate-stampSlam">CLASSIFIED</div>

          <div className="space-y-4">
            <div className="border-b border-dossier-border pb-3">
              <h2 className="font-typewriter text-sm tracking-wider opacity-70">
                INTELLIGENCE BUREAU OF INDIA — EYES ONLY
              </h2>
              <h3 className="font-typewriter text-lg mt-1">
                AGENT {agentName} — YOU HAVE BEEN ACTIVATED
              </h3>
            </div>

            <p className="font-typewriter text-sm leading-relaxed">{brief}</p>

            <div className="bg-dossier-text/5 p-4 border border-dossier-border">
              <p className="font-typewriter text-xs opacity-60 mb-2">
                ENCODED TRANSMISSION:
              </p>
              <p className="font-mono text-2xl md:text-3xl tracking-[0.3em] text-center font-bold">
                PHHW DW WKH SRUW
              </p>
            </div>

            {/* Timer */}
            <div className="text-center">
              <span className={`text-5xl font-mono font-bold ${timerColor}`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>

            {/* Answer state messages */}
            {answerState === "correct" && (
              <div className="text-center animate-fadeIn">
                <p className="text-green-700 font-typewriter text-lg font-bold">
                  TRANSMISSION DECODED SUCCESSFULLY
                </p>
              </div>
            )}

            {answerState === "wrong" && (
              <div className="text-center animate-shake">
                <p className="text-dossier-stamp font-typewriter text-sm font-bold">
                  TRANSMISSION CORRUPTED — TRY AGAIN
                </p>
              </div>
            )}

            {answerState === "failed" && (
              <div className="text-center space-y-3 animate-fadeIn">
                <p className="text-dossier-stamp font-typewriter text-sm">
                  DECRYPTION FAILED. THE ANSWER WAS:
                </p>
                <p className="font-mono text-lg font-bold">MEET AT THE PORT</p>
                <button
                  onClick={() =>
                    router.push(
                      `/game?name=${encodeURIComponent(agentName)}&code=${referralCode}`
                    )
                  }
                  className="bg-dossier-stamp text-white font-heading font-bold px-6 py-3
                             min-h-[48px] text-lg uppercase tracking-wider"
                >
                  CONTINUE MISSION
                </button>
              </div>
            )}

            {/* Multiple choice */}
            {answerState !== "correct" && answerState !== "failed" && (
              <div className="grid grid-cols-1 gap-3">
                {shuffledChoices.map((choice, i) => (
                  <button
                    key={choice}
                    onClick={() => handleAnswer(choice)}
                    disabled={isSubmitting}
                    className="text-left px-4 py-3 min-h-[48px] border border-dossier-border
                               font-typewriter text-sm hover:bg-dossier-text/10 transition-colors
                               disabled:opacity-50 flex items-center gap-3"
                  >
                    <span className="font-bold text-lg">
                      {String.fromCharCode(65 + i)})
                    </span>
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MissionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center bg-terminal-bg">
          <p className="text-terminal-green">Loading mission...</p>
        </main>
      }
    >
      <MissionContent />
    </Suspense>
  );
}
