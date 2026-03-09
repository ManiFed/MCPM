import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const COLORS = [
  "hsl(142, 72%, 50%)", // profit green
  "hsl(45, 100%, 55%)", // accent gold
  "hsl(200, 80%, 55%)", // chart blue
  "hsl(280, 70%, 60%)", // chart purple
  "hsl(142, 72%, 70%)", // light green
];

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 720 - 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 4,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}vw`, y: "-5vh", rotate: 0, opacity: 1 }}
            animate={{
              y: "110vh",
              rotate: p.rotation,
              x: `${p.x + (Math.random() * 20 - 10)}vw`,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2 + Math.random(),
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size * 1.4,
              backgroundColor: p.color,
              borderRadius: p.size > 7 ? "50%" : "1px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
