import { useEffect, useState } from 'react';

const PHASES = [
  { atMs: 0, label: 'Thinking through your image…' },
  { atMs: 6000, label: 'Composing the scene…' },
  { atMs: 14000, label: 'Mixing the palette…' },
  { atMs: 26000, label: 'Adding the final touches…' },
  { atMs: 45000, label: 'Almost there — sometimes the best ones take a moment…' },
];

function phaseIndexForElapsed(elapsedMs) {
  let index = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (elapsedMs >= PHASES[i].atMs) index = i;
  }
  return index;
}

export default function useElapsedPhase(startedAt) {
  const [phaseIndex, setPhaseIndex] = useState(() =>
    typeof startedAt === 'number' ? phaseIndexForElapsed(Date.now() - startedAt) : 0
  );

  useEffect(() => {
    if (typeof startedAt !== 'number') return undefined;

    const now = Date.now();
    const elapsed = now - startedAt;
    setPhaseIndex(phaseIndexForElapsed(elapsed));

    const timeouts = [];
    for (let i = 0; i < PHASES.length; i++) {
      const fireIn = PHASES[i].atMs - elapsed;
      if (fireIn <= 0) continue;
      const id = setTimeout(() => setPhaseIndex(i), fireIn);
      timeouts.push(id);
    }

    return () => {
      for (const id of timeouts) clearTimeout(id);
    };
  }, [startedAt]);

  return {
    phaseIndex,
    label: PHASES[phaseIndex].label,
  };
}

export { PHASES };
