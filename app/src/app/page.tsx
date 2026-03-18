"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function LandingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const line1 = "INCOMING TRANSMISSION FROM IB HEADQUARTERS...";
  const line2 = "AGENT REQUIRED. CLEARANCE LEVEL: DELTA.";

  const [displayed1, setDisplayed1] = useState("");
  const [displayed2, setDisplayed2] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < line1.length) {
        setDisplayed1(line1.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setLine1Done(true);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!line1Done) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < line2.length) {
        setDisplayed2(line2.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setLine2Done(true);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [line1Done]);

  useEffect(() => {
    if (line2Done) {
      const t = setTimeout(() => setShowButton(true), 300);
      return () => clearTimeout(t);
    }
  }, [line2Done]);

  const sanitizedFrom = from
    ? from.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20).toUpperCase()
    : null;

  const handleAccept = () => {
    const params = from ? `?from=${encodeURIComponent(from)}` : "";
    router.push(`/mission${params}`);
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 bg-terminal-bg">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-left">
          <p className="text-terminal-green text-lg md:text-xl leading-relaxed">
            {displayed1}
            {!line1Done && <span className="typewriter-cursor" />}
          </p>
          {line1Done && (
            <p className="text-terminal-green text-lg md:text-xl leading-relaxed mt-2">
              {displayed2}
              {!line2Done && <span className="typewriter-cursor" />}
            </p>
          )}
        </div>

        {line2Done && sanitizedFrom && (
          <p className="text-terminal-amber text-sm animate-fadeIn">
            Agent {sanitizedFrom} has flagged you for recruitment.
          </p>
        )}

        {showButton && (
          <div className="animate-fadeIn">
            <button onClick={handleAccept} className="btn-primary w-full">
              [ ACCEPT MISSION ]
            </button>
          </div>
        )}
      </div>

      <p className="fixed bottom-4 text-terminal-dim text-xs text-center px-4">
        Dhurandhar: The Revenge — In Cinemas Now
      </p>
    </main>
  );
}

export default function Landing() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center bg-terminal-bg">
          <p className="text-terminal-green">Loading...</p>
        </main>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
