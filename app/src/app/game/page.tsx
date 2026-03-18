"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  playBeep,
  playCorrect,
  playWrong,
  playTick,
  playUrgentTick,
  playStampSlam,
  playMissionComplete,
  playFailure,
  playStreak,
} from "@/lib/sounds";

interface Mission {
  id: number;
  title: string;
  cipherType: string;
  encoded: string;
  brief: string;
  timeLimit: number;
  hint: string;
  decoderTable: string[];
}

// Start from mission 2 since mission 1 was played on /mission
const MISSIONS: Mission[] = [
  {
    id: 2,
    title: "MISSION 2: THE MIRROR MESSAGE",
    cipherType: "Reverse",
    encoded: "ENO ON TSURT",
    brief:
      "Director Sanyal left a message written backwards on a foggy mirror at the safehouse. Read it in reverse to find the truth.",
    timeLimit: 60,
    hint: "The message is simply written backwards. Read from right to left.",
    decoderTable: [
      "HELLO → OLLEH",
      "WORLD → DLROW",
      "Read right to left",
    ],
  },
  {
    id: 3,
    title: "MISSION 3: THE ATBASH INTERCEPT",
    cipherType: "Atbash",
    encoded: "WZMTVI RM PZIZXSR",
    brief:
      "An Atbash-encoded message was found in a dead drop near Clifton Beach. In Atbash, A=Z, B=Y, C=X... the alphabet is reversed.",
    timeLimit: 90,
    hint: "Atbash: A↔Z, B↔Y, C↔X, D↔W... The alphabet maps to its mirror.",
    decoderTable: [
      "A↔Z  B↔Y  C↔X  D↔W",
      "E↔V  F↔U  G↔T  H↔S",
      "I↔R  J↔Q  K↔P  L↔O",
      "M↔N",
    ],
  },
  {
    id: 4,
    title: "MISSION 4: THE MORSE SIGNAL",
    cipherType: "Morse Code",
    encoded: ".- -... --- .-. -",
    brief:
      "A faint Morse code signal was picked up from a fishing vessel off the Makran coast. Decode the dots and dashes.",
    timeLimit: 90,
    hint: "Standard Morse code. Use the reference table to decode each letter separated by spaces.",
    decoderTable: [
      "A: .-    B: -...  C: -.-.",
      "D: -..   E: .     F: ..-.",
      "O: ---   R: .-.   T: -",
    ],
  },
  {
    id: 5,
    title: "MISSION 5: THE ROT-13 FILE",
    cipherType: "ROT-13",
    encoded: "BCRENGVBA ERIRATR",
    brief:
      "A classified file was encrypted with ROT-13 — the standard cipher used by ISI handlers. Shift each letter 13 positions.",
    timeLimit: 75,
    hint: "ROT-13: shift each letter by 13. A→N, B→O, C→P... N→A, O→B...",
    decoderTable: [
      "A→N  B→O  C→P  D→Q",
      "E→R  F→S  G→T  H→U",
      "I→V  J→W  K→X  L→Y",
      "M→Z  N→A  O→B  P→C",
    ],
  },
  {
    id: 6,
    title: "MISSION 6: THE NATO BROADCAST",
    cipherType: "NATO Phonetic Alphabet",
    encoded: "Hotel Alpha Mike Zulu Alpha  Lima India Victor Echo Sierra",
    brief:
      "A NATO phonetic broadcast was intercepted over military frequencies near the border. Each word represents a single letter.",
    timeLimit: 120,
    hint: "NATO phonetic: Alpha=A, Bravo=B, Charlie=C... Each word is one letter.",
    decoderTable: [
      "Alpha=A  Bravo=B  Charlie=C",
      "Echo=E   Hotel=H  India=I",
      "Lima=L   Mike=M   Sierra=S",
      "Victor=V  Zulu=Z",
    ],
  },
  {
    id: 7,
    title: "MISSION 7: THE FINAL TRANSMISSION",
    cipherType: "Caesar Shift-5",
    encoded: "YMJ  WJAJSLJ  NX  HTRQJYJ",
    brief:
      "The final message uses a Caesar shift of 5. This is the last piece of intelligence. Decode it to complete Operation Dhurandhar.",
    timeLimit: 150,
    hint: "Caesar-5: each letter shifted forward by 5. A→F, B→G, C→H... Shift backward to decode.",
    decoderTable: [
      "A→F  B→G  C→H  D→I",
      "E→J  F→K  G→L  H→M",
      "R→W  S→X  T→Y  U→Z",
      "V→A  W→B  X→C  Y→D",
    ],
  },
];

interface MissionResult {
  completed: boolean;
  score: number;
}

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentName = searchParams.get("name") || sessionStorage.getItem("agent_name") || "AGENT";
  const referralCode = searchParams.get("code") || sessionStorage.getItem("referral_code") || "";

  const [currentMission, setCurrentMission] = useState(0);
  const [gameState, setGameState] = useState<"intro" | "playing" | "transition" | "complete">("intro");
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(MISSIONS[0].timeLimit);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [hintUsedThisMission, setHintUsedThisMission] = useState(false);
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<MissionResult[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState<"" | "green" | "red">("");
  const [copied, setCopied] = useState(false);

  const mission = MISSIONS[currentMission];

  // Intro auto-advance
  useEffect(() => {
    if (gameState !== "intro") return;
    playStampSlam();
    const t = setTimeout(() => setGameState("playing"), 2000);
    return () => clearTimeout(t);
  }, [gameState]);

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const triggerFlash = (color: "green" | "red") => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(""), 300);
  };

  const advanceMission = useCallback(() => {
    const next = currentMission + 1;
    if (next >= MISSIONS.length) {
      setGameState("complete");
      playMissionComplete();
    } else {
      setGameState("transition");
      setCurrentMission(next);
      setTimeLeft(MISSIONS[next].timeLimit);
      setAnswer("");
      setFeedback("");
      setShowHint(false);
      setHintUsedThisMission(false);
      setTimeout(() => {
        setGameState("playing");
        playStampSlam();
      }, 1200);
    }
  }, [currentMission]);

  const handleSkip = useCallback(() => {
    setResults((r) => [...r, { completed: false, score: 0 }]);
    setStreak(0);
    playFailure();
    triggerScreenShake();
    triggerFlash("red");
    advanceMission();
  }, [advanceMission]);

  // Timer with sound
  useEffect(() => {
    if (gameState !== "playing") return;
    if (feedback === "correct") return;
    if (timeLeft <= 0) {
      handleSkip();
      return;
    }
    if (timeLeft <= 10) {
      playUrgentTick();
    } else if (timeLeft <= 20) {
      playTick();
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, feedback, handleSkip]);

  const calculateScore = useCallback(
    (hintUsed: boolean) => {
      const base = 200;
      const timeBonus = timeLeft * 3;
      const streakBonus = streak * 30;
      const difficultyBonus = (mission.id - 1) * 50;
      const hintPenalty = hintUsed ? 50 : 0;
      return base + timeBonus + streakBonus + difficultyBonus - hintPenalty;
    },
    [timeLeft, streak, mission.id]
  );

  const handleSubmit = async () => {
    if (isSubmitting || !answer.trim()) return;
    setIsSubmitting(true);
    playBeep();

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: answer.trim(),
          question_id: mission.id,
        }),
      });
      const data = await res.json();

      if (data.correct) {
        const newStreak = streak + 1;
        const missionScore = calculateScore(hintUsedThisMission);
        setScore((s) => s + missionScore);
        setStreak(newStreak);
        setFeedback("correct");
        setResults((r) => [...r, { completed: true, score: missionScore }]);
        playCorrect();
        triggerFlash("green");
        if (newStreak >= 2) {
          setTimeout(() => playStreak(newStreak), 400);
        }

        setTimeout(() => advanceMission(), 1500);
      } else {
        setFeedback("wrong");
        setStreak(0);
        playWrong();
        triggerScreenShake();
        triggerFlash("red");
        setTimeout(() => setFeedback(""), 1000);
      }
    } catch {
      setFeedback("wrong");
      playWrong();
      triggerScreenShake();
      setTimeout(() => setFeedback(""), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const useHintAction = () => {
    if (hintsLeft <= 0) return;
    playBeep();
    setHintsLeft((h) => h - 1);
    setShowHint(true);
    setHintUsedThisMission(true);
  };

  const timerColor =
    timeLeft <= 10
      ? "timer-danger"
      : timeLeft <= 20
        ? "timer-amber"
        : "timer-normal";

  const timerPulse = timeLeft <= 10 ? "animate-pulse" : "";

  // Progress bar
  const progress = ((currentMission + (feedback === "correct" ? 1 : 0)) / MISSIONS.length) * 100;

  // Screen effect classes
  const shakeClass = screenShake ? "animate-shake" : "";
  const flashClass = screenFlash === "green"
    ? "screen-flash-green"
    : screenFlash === "red"
      ? "screen-flash-red"
      : "";

  // Intro screen
  if (gameState === "intro") {
    return (
      <main className="min-h-dvh bg-terminal-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-terminal-amber text-sm font-mono tracking-widest">
            INCOMING TRANSMISSION
          </p>
          <h1 className="text-terminal-green text-2xl md:text-3xl font-heading font-bold">
            AGENT {agentName}
          </h1>
          <p className="text-terminal-green text-lg font-mono">
            6 CIPHERS REMAIN. DECODE THEM ALL.
          </p>
          <div className="flex justify-center gap-1 mt-4">
            {MISSIONS.map((_, i) => (
              <div key={i} className="w-8 h-1 bg-terminal-border" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Transition between missions
  if (gameState === "transition") {
    return (
      <main className="min-h-dvh bg-terminal-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-terminal-green text-lg font-mono tracking-widest">
            LOADING NEXT TRANSMISSION...
          </p>
          <div className="flex justify-center gap-1">
            {MISSIONS.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 ${
                  i < currentMission
                    ? results[i]?.completed
                      ? "bg-terminal-green"
                      : "bg-terminal-danger"
                    : "bg-terminal-border"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Complete screen
  if (gameState === "complete") {
    const emojiGrid = results
      .map((r) => (r.completed ? "✅" : "❌"))
      .join("");
    const completedCount = results.filter((r) => r.completed).length;
    const shareText = `🕵️ Operation Dhurandhar — Cipher Game\nScore: ${score} | ${completedCount}/${MISSIONS.length} missions\n${emojiGrid}\nCan you beat my score?\n#Dhurandhar2 #OperationDhurandhar`;

    return (
      <main className="min-h-dvh bg-terminal-bg px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full space-y-6 text-center animate-fadeIn">
          <h1 className="text-terminal-green text-2xl font-heading font-bold">
            OPERATION COMPLETE
          </h1>
          <p className="text-terminal-amber text-5xl font-mono font-bold">
            {score}
          </p>
          <p className="text-terminal-dim text-sm">TOTAL SCORE</p>

          <div className="flex justify-center gap-2 text-2xl">
            {results.map((r, i) => (
              <span key={i}>{r.completed ? "✅" : "❌"}</span>
            ))}
          </div>

          <div className="border border-terminal-border p-4 space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex justify-between font-mono text-sm text-terminal-dim"
              >
                <span>Mission {i + 2}</span>
                <span
                  className={
                    r.completed ? "text-terminal-green" : "text-terminal-danger"
                  }
                >
                  {r.completed ? `+${r.score}` : "FAILED"}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              setCopied(true);
              playBeep();
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn-primary w-full"
          >
            {copied ? "COPIED!" : "COPY SCORE TO SHARE"}
          </button>

          <button
            onClick={() => {
              playBeep();
              router.push(
                `/debrief?name=${encodeURIComponent(agentName)}&code=${referralCode}&score=${score}`
              );
            }}
            className="btn-primary w-full bg-terminal-amber text-black"
          >
            PROCEED TO DEBRIEF →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-dvh bg-terminal-bg px-4 py-4 ${shakeClass} ${flashClass}`}>
      <div className="max-w-lg mx-auto space-y-4">
        {/* Progress bar */}
        <div className="w-full h-1 bg-terminal-border overflow-hidden">
          <div
            className="h-full bg-terminal-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Score panel */}
        <div className="flex justify-between items-center text-sm font-mono border border-terminal-border px-3 py-2">
          <span className="text-terminal-green">
            SCORE: <span className="font-bold">{score}</span>
          </span>
          <span className="text-terminal-dim">
            {currentMission + 1}/{MISSIONS.length}
          </span>
          {streak >= 2 && (
            <span className="text-terminal-amber animate-pulse">
              🔥 x{streak}
            </span>
          )}
          <span className="text-terminal-dim">
            HINTS: {hintsLeft}
          </span>
        </div>

        {/* Dossier card */}
        <div className="relative bg-dossier-bg text-dossier-text p-5 md:p-6 border border-dossier-border paper-noise">
          <div className="classified-stamp animate-stampSlam">CLASSIFIED</div>

          <div className="space-y-4">
            <h2 className="font-typewriter text-sm tracking-wider opacity-70 pr-24">
              {mission.title}
            </h2>
            <p className="font-typewriter text-xs text-dossier-text/60">
              Cipher: {mission.cipherType}
            </p>

            <p className="font-typewriter text-sm leading-relaxed">
              {mission.brief}
            </p>

            {/* Encoded message */}
            <div className="bg-dossier-text/5 p-4 border border-dossier-border">
              <p className="font-typewriter text-xs opacity-60 mb-2">
                ENCODED TRANSMISSION:
              </p>
              <p className="font-mono text-lg md:text-xl tracking-[0.15em] text-center font-bold break-all">
                {mission.encoded}
              </p>
            </div>

            {/* Decoder reference */}
            <div className="bg-dossier-text/5 p-3 border border-dossier-border">
              <p className="font-typewriter text-xs opacity-60 mb-1">
                DECODER REFERENCE:
              </p>
              {mission.decoderTable.map((row, i) => (
                <p key={i} className="font-mono text-xs leading-relaxed">
                  {row}
                </p>
              ))}
            </div>

            {/* Hint */}
            {showHint && (
              <div className="bg-yellow-100 border border-yellow-400 p-3 animate-fadeIn">
                <p className="font-typewriter text-xs text-yellow-800">
                  HINT: {mission.hint}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <span className={`text-4xl font-mono font-bold ${timerColor} ${timerPulse}`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="TYPE YOUR ANSWER..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent border border-terminal-border text-terminal-green
                       px-4 py-3 font-mono text-lg uppercase placeholder:text-terminal-dim/50
                       focus:outline-none focus:border-terminal-green"
            autoFocus
          />

          {/* Feedback */}
          {feedback === "correct" && (
            <p className="text-terminal-green text-center font-mono text-sm animate-fadeIn font-bold">
              ✓ CORRECT — TRANSMISSION DECODED
              {streak >= 2 && (
                <span className="text-terminal-amber ml-2">
                  🔥 {streak}x STREAK BONUS!
                </span>
              )}
            </p>
          )}
          {feedback === "wrong" && (
            <p className="text-terminal-danger text-center font-mono text-sm animate-shake font-bold">
              ✗ INCORRECT — TRY AGAIN
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !answer.trim()}
              className="btn-primary flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              DECODE
            </button>
            <button
              onClick={useHintAction}
              disabled={hintsLeft <= 0}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              HINT (-50)
            </button>
            <button onClick={handleSkip} className="btn-secondary text-sm">
              SKIP
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center bg-terminal-bg">
          <p className="text-terminal-green">Loading missions...</p>
        </main>
      }
    >
      <GameContent />
    </Suspense>
  );
}
