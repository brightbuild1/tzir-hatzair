/**
 * Aurora — animated background inspired by React Bits (reactbits.dev)
 * No external dependencies. Self-contained CSS keyframe animations.
 */

const KEYFRAMES = `
@keyframes aurora-blob-1 {
  0%, 100% { transform: translate(0px,   0px)   scale(1);    }
  25%       { transform: translate(80px, -60px)  scale(1.15); }
  50%       { transform: translate(-40px, 80px)  scale(0.95); }
  75%       { transform: translate(60px,  40px)  scale(1.08); }
}
@keyframes aurora-blob-2 {
  0%, 100% { transform: translate(0px,   0px)   scale(1);    }
  30%       { transform: translate(-90px, 50px)  scale(1.1);  }
  60%       { transform: translate(50px, -70px)  scale(1.2);  }
}
@keyframes aurora-blob-3 {
  0%, 100% { transform: translate(0px,  0px)   scale(1);    }
  40%       { transform: translate(70px, 60px)  scale(1.18); }
  80%       { transform: translate(-50px,-40px) scale(0.9);  }
}
@keyframes aurora-blob-4 {
  0%, 100% { transform: translate(0px,  0px)  scale(1);    }
  50%       { transform: translate(-60px,80px) scale(1.12); }
}
@keyframes aurora-blob-5 {
  0%, 100% { transform: translate(0px, 0px)   scale(1);    }
  35%       { transform: translate(50px,-50px) scale(1.05); }
  70%       { transform: translate(-30px,60px) scale(0.92); }
}
@keyframes aurora-shimmer {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1;   }
}
`;

interface AuroraProps {
  /** Extra class names for the wrapper */
  className?: string;
}

export default function Aurora({ className = '' }: AuroraProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg, #010d1e 0%, #021430 50%, #011025 100%)' }}
    >
      <style>{KEYFRAMES}</style>

      {/* Grid / noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)',
        }}
      />

      {/* ── Blob 1 — large primary blue, top-left ─── */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(ellipse at center, rgba(0,86,179,0.65) 0%, rgba(0,63,135,0.3) 45%, transparent 70%)',
          filter: 'blur(64px)',
          animation: 'aurora-blob-1 18s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Blob 2 — cyan / teal, top-right ─────── */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '-5%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(ellipse at center, rgba(8,145,178,0.5) 0%, rgba(6,182,212,0.2) 50%, transparent 70%)',
          filter: 'blur(72px)',
          animation: 'aurora-blob-2 22s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Blob 3 — deep indigo, centre ─────────── */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          right: '20%',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.4) 0%, rgba(99,102,241,0.15) 50%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora-blob-3 16s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Blob 4 — sky blue, bottom-left ───────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '10%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(ellipse at center, rgba(14,116,144,0.45) 0%, rgba(22,163,184,0.2) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora-blob-4 20s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Blob 5 — electric blue accent, bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-5%',
          right: '-5%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(29,78,216,0.55) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
          filter: 'blur(56px)',
          animation: 'aurora-blob-5 14s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Shimmer veil — slow brightness pulse ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,86,179,0.08) 0%, transparent 100%)',
          animation: 'aurora-shimmer 8s ease-in-out infinite',
        }}
      />

      {/* ── Bottom gradient → text readability ─── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,20,50,0.85) 0%, rgba(0,20,50,0.3) 40%, transparent 70%)',
        }}
      />
    </div>
  );
}
