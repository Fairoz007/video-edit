import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function MeterBar({ level, delay }: { level: number; delay: number }) {
  return (
    <motion.div
      className="audio-meter-bar"
      animate={{ height: `${12 + level * 88}%` }}
      transition={{ duration: 0.12, delay }}
    />
  );
}

export function AudioMeters({ active }: { active: boolean }) {
  const [levels, setLevels] = useState([0.3, 0.5, 0.4, 0.6, 0.35, 0.55, 0.45, 0.5]);

  useEffect(() => {
    if (!active) {
      setLevels([0.08, 0.1, 0.08, 0.1, 0.08, 0.1, 0.08, 0.1]);
      return;
    }
    const id = setInterval(() => {
      setLevels(Array.from({ length: 8 }, () => 0.2 + Math.random() * 0.75));
    }, 120);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="audio-meters" aria-hidden>
      <div className="audio-meters-track">
        {levels.map((level, i) => (
          <MeterBar key={i} level={level} delay={i * 0.01} />
        ))}
      </div>
      <div className="audio-meters-track audio-meters-track-r">
        {levels.map((level, i) => (
          <MeterBar key={i} level={level * 0.92} delay={i * 0.01 + 0.02} />
        ))}
      </div>
    </div>
  );
}
