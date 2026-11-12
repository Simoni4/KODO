import React, { useEffect, useState } from 'react';

export const KodoHeroMascot: React.FC = () => {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 160);
    }, 3100);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="bf-wordmark relative z-10 mb-[-8px] text-center">
        <div className="text-[clamp(2.5rem,12vw,4.4rem)] font-black leading-[0.88] tracking-tight text-white">Bouncy</div>
        <div className="mt-1 text-[clamp(2.7rem,13vw,4.7rem)] font-black leading-[0.9] tracking-tight text-amber-300">Friends</div>
      </div>
      <div className="bf-mascot-wrap relative mt-1 flex h-[min(34vh,250px)] w-full items-center justify-center">
        <div className="absolute bottom-5 h-5 w-36 rounded-full bg-slate-950/35 blur-md" />
        <svg viewBox="0 0 220 220" role="img" aria-label="Blue bird mascot" className="relative z-10 h-full max-w-full overflow-visible">
          <defs>
            <radialGradient id="bfBirdBody" cx="34%" cy="22%" r="80%"><stop offset="0%" stopColor="#7dd3fc"/><stop offset="48%" stopColor="#168bd4"/><stop offset="100%" stopColor="#07539a"/></radialGradient>
            <linearGradient id="bfBirdBelly" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#cdeaff"/></linearGradient>
            <linearGradient id="bfBirdScarf" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff7777"/><stop offset="1" stopColor="#c92342"/></linearGradient>
          </defs>
          <ellipse cx="110" cy="198" rx="54" ry="9" fill="#071b3a" opacity=".28"/>
          <g className="bf-bird-hop">
            <path d="M65 112 Q27 96 35 137 Q43 159 76 145Z" fill="#0866ad"/>
            <path d="M155 112 Q193 96 185 137 Q177 159 144 145Z" fill="#0866ad"/>
            <ellipse cx="110" cy="117" rx="65" ry="70" fill="url(#bfBirdBody)"/>
            <ellipse cx="110" cy="145" rx="43" ry="38" fill="url(#bfBirdBelly)"/>
            <path d="M77 62 Q63 29 86 43 L104 62Z" fill="#168bd4"/>
            <path d="M101 57 Q105 20 124 43 L121 63Z" fill="#38bdf8"/>
            <path d="M119 62 Q143 31 150 53 L132 76Z" fill="#0b70b8"/>
            <ellipse cx="83" cy="103" rx="20" ry="24" fill="white"/>
            <ellipse cx="137" cy="103" rx="20" ry="24" fill="white"/>
            {blink ? <><path d="M68 106 Q83 116 98 106" stroke="#102b4e" strokeWidth="5" fill="none" strokeLinecap="round"/><path d="M122 106 Q137 116 152 106" stroke="#102b4e" strokeWidth="5" fill="none" strokeLinecap="round"/></> : <><ellipse cx="87" cy="105" rx="10" ry="14" fill="#102b4e"/><ellipse cx="133" cy="105" rx="10" ry="14" fill="#102b4e"/><circle cx="90" cy="99" r="4" fill="white"/><circle cx="136" cy="99" r="4" fill="white"/></>}
            <ellipse cx="67" cy="137" rx="11" ry="6" fill="#f68ca4" opacity=".55"/><ellipse cx="153" cy="137" rx="11" ry="6" fill="#f68ca4" opacity=".55"/>
            <path d="M94 125 L126 125 L110 148Z" fill="#ffad20" stroke="#d56a0b" strokeWidth="2"/>
            <path d="M70 151 Q110 164 150 151 L146 169 Q110 183 74 169Z" fill="url(#bfBirdScarf)"/>
            <path d="M124 164 L145 166 L143 198 Q134 204 126 195Z" fill="#e43c50"/>
            <path d="M130 168 L139 169 L138 195 L130 194Z" fill="#ff8790" opacity=".65"/>
            <ellipse cx="87" cy="190" rx="17" ry="7" fill="#f6a21a"/><ellipse cx="134" cy="190" rx="17" ry="7" fill="#e98b10"/>
          </g>
        </svg>
      </div>
    </div>
  );
};
