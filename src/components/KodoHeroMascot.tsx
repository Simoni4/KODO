import React, { useEffect, useState } from 'react';

export const KodoHeroMascot: React.FC = () => {
  const [blink,setBlink]=useState(false);
  useEffect(()=>{const id=window.setInterval(()=>{setBlink(true);window.setTimeout(()=>setBlink(false),150)},3200);return()=>window.clearInterval(id)},[]);
  return <div className="bf-island-scene" aria-label="A floating snowy island with the blue Bouncy Friends bird">
    <svg viewBox="0 0 520 390" role="img" className="bf-island-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="isSnow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#dff6ff"/><stop offset="1" stopColor="#8dc9ee"/></linearGradient>
        <linearGradient id="isRock" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#659fc2"/><stop offset="1" stopColor="#15365f"/></linearGradient>
        <radialGradient id="isBird" cx="28%" cy="15%" r="85%"><stop stopColor="#9ceaff"/><stop offset=".48" stopColor="#39a9ed"/><stop offset="1" stopColor="#0757a8"/></radialGradient>
        <linearGradient id="isGold" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff18b"/><stop offset="1" stopColor="#f18a12"/></linearGradient>
        <filter id="isBlur"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      <ellipse cx="260" cy="349" rx="190" ry="19" fill="#061632" opacity=".38" filter="url(#isBlur)"/>
      <path d="M65 207 260 105 455 207 260 322Z" fill="url(#isRock)" stroke="#9ce4ff" strokeWidth="2"/>
      <path d="M65 207 260 322V354L65 241Z" fill="#28577d"/><path d="M260 322 455 207V241L260 354Z" fill="#15395f"/>
      <g stroke="#9bdcff" strokeWidth="2" strokeLinejoin="round">
        <path d="M65 207 112 183 159 207 112 232Z" fill="url(#isSnow)"/><path d="M112 183 159 159 206 183 159 207Z" fill="#fff"/>
        <path d="M159 207 206 183 253 207 206 232Z" fill="url(#isSnow)"/><path d="M206 183 253 159 300 183 253 207Z" fill="#eafaff"/>
        <path d="M253 207 300 183 347 207 300 232Z" fill="url(#isSnow)"/><path d="M300 183 347 159 394 183 347 207Z" fill="#fff"/>
        <path d="M347 207 394 183 441 207 394 232Z" fill="url(#isSnow)"/>
        <path d="M89 254 136 230 183 254 136 278Z" fill="#e6f8ff"/><path d="M136 230 183 207 230 230 183 254Z" fill="#fff"/>
        <path d="M183 254 230 230 277 254 230 278Z" fill="url(#isSnow)"/><path d="M230 230 277 207 324 230 277 254Z" fill="#eafaff"/>
        <path d="M277 254 324 230 371 254 324 278Z" fill="#fff"/><path d="M324 230 371 207 418 230 371 254Z" fill="url(#isSnow)"/>
        <path d="M136 278 183 254 230 278 183 302Z" fill="url(#isSnow)"/><path d="M230 278 277 254 324 278 277 302Z" fill="#fff"/><path d="M324 278 371 254 418 278 371 302Z" fill="url(#isSnow)"/>
      </g>
      <g>
        <path d="M111 181v35M111 120 78 177l23-5-29 29 39-9 39 9-28-29 23 5Z" fill="#145078" stroke="#8de2fa" strokeWidth="3"/>
        <path d="M390 170v37M390 108 355 169l24-5-31 29 42-9 42 9-29-29 24 5Z" fill="#12486e" stroke="#8de2fa" strokeWidth="3"/>
      </g>
      <ellipse cx="357" cy="187" rx="35" ry="13" fill="#5de0ff" opacity=".3" filter="url(#isBlur)"/>
      <path d="M338 203v-44a20 20 0 0 1 40 0v44" fill="none" stroke="#8deaff" strokeWidth="12"/><path d="M338 203v-44a20 20 0 0 1 40 0v44" fill="none" stroke="#f1fdff" strokeWidth="4"/>
      <path d="M358 139V99" stroke="#f1f8ff" strokeWidth="4"/><path d="m360 101 39 11-39 11Z" fill="#ff626b" stroke="#fff0d0" strokeWidth="2"/><circle cx="358" cy="98" r="5" fill="#ffd65a"/>
      <path d="M174 178v17" stroke="#e9f8ff" strokeWidth="3"/><path d="M165 194q9-10 18 0l-3 17h-12Z" fill="#ffd05b" stroke="#fff2b2" strokeWidth="2"/>
      <ellipse cx="254" cy="290" rx="52" ry="11" fill="#09264c" opacity=".3" filter="url(#isBlur)"/>
      <g className="bf-island-bird">
        <path d="M218 229q-30-23-24 16 4 16 32 9M290 229q30-23 24 16-4 16-32 9" fill="#1768ad"/>
        <ellipse cx="254" cy="231" rx="48" ry="51" fill="url(#isBird)" stroke="#bcefff" strokeWidth="2"/>
        <ellipse cx="254" cy="250" rx="31" ry="27" fill="#f6fdff"/>
        <path d="m226 194-13-27q25 4 39 31M247 191q5-32 23-8l-4 18M267 197q21-25 29-4l-17 18" fill="#36a9ed"/>
        <ellipse cx="236" cy="224" rx="14" ry="17" fill="white"/><ellipse cx="272" cy="224" rx="14" ry="17" fill="white"/>
        {blink?<><path d="M225 227q11 8 22 0M261 227q11 8 22 0" stroke="#102b4e" strokeWidth="4" fill="none" strokeLinecap="round"/></>:<><ellipse cx="238" cy="225" rx="7" ry="10" fill="#102b4e"/><ellipse cx="274" cy="225" rx="7" ry="10" fill="#102b4e"/><circle cx="240" cy="221" r="3" fill="white"/><circle cx="276" cy="221" r="3" fill="white"/></>}
        <ellipse cx="217" cy="246" rx="8" ry="5" fill="#ff9eb2" opacity=".7"/><ellipse cx="291" cy="246" rx="8" ry="5" fill="#ff9eb2" opacity=".7"/>
        <path d="m242 239h24l-12 17Z" fill="url(#isGold)" stroke="#d9790d" strokeWidth="1.5"/>
        <path d="M219 258q35 14 70 0l-4 13q-31 14-62 0Z" fill="#e84955" stroke="#ff9a9d" strokeWidth="2"/><path d="m271 267 14 0-2 27q-7 6-14-2Z" fill="#d9364c"/>
        <path d="M229 286q10-5 18 1l-2 9q-13 4-21-3ZM260 287q10-5 19 0l3 8q-13 5-24 0Z" fill="url(#isGold)"/>
      </g>
      <g fill="#fff"><circle cx="61" cy="148" r="3"/><circle cx="457" cy="151" r="2.5"/><circle cx="308" cy="83" r="3"/><path d="m55 91 4 9 9 3-9 4-4 9-4-9-9-4 9-3Z"/><path d="m455 73 4 8 8 3-8 4-4 8-3-8-8-4 8-3Z"/></g>
    </svg>
  </div>;
};
