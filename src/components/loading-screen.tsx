"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "exit">("intro");

  useEffect(() => {
    
    // Phase 2: Reveal phase
    const timer2 = setTimeout(() => {
      setPhase("reveal");
    }, 1500);

    // Phase 3: Exit phase
    const timer3 = setTimeout(() => {
      setPhase("exit");
    }, 2800);

    // Complete and remove loading screen
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-gradient-to-br from-neutral-900 via-black to-neutral-900 flex items-center justify-center overflow-hidden"
        >
          {/* Logo text */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1,
                scale: 1,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Main logo */}
              <motion.h1
                className="text-6xl md:text-8xl font-bold tracking-tight font-[family-name:var(--font-space)] text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {"Polyseer".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.5 + i * 0.05,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    className="inline-block"
                    style={{
                      textShadow: phase === "reveal" 
                        ? "0 0 30px rgba(255,255,255,0.5)" 
                        : "0 0 10px rgba(255,255,255,0.3)",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: phase === "reveal" ? 1 : 0,
                  y: phase === "reveal" ? 0 : 10,
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mt-4 text-white/60 text-sm md:text-base tracking-wider"
              >
                See the future
              </motion.p>
            </motion.div>

            {/* Scanning line effect */}
            {phase === "reveal" && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{
                    duration: 1,
                    repeat: 1,
                    ease: "linear",
                  }}
                  style={{
                    boxShadow: "0 0 20px rgba(255,255,255,0.8)",
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* Bottom progress dots */}
          <motion.div
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/30"
                animate={{
                  backgroundColor: phase === "intro" && i === 0
                    ? "rgba(255,255,255,0.8)"
                    : phase === "reveal" && i === 1
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.3)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}