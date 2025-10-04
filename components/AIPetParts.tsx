// components/AIPetParts.tsx
import React from "react";

// === BODY SHAPES (anime chibi monster style) ===
export const BodyShapes = {
  blob: (color: string) => (
    <path
      d="M50,10 Q90,20 80,60 Q90,100 50,110 Q10,100 20,60 Q10,20 50,10Z"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
  beast: (color: string) => (
    <path
      d="M30,40 Q50,0 90,30 Q110,60 90,90 Q50,120 30,80Z"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
  machine: (color: string) => (
    <rect
      x="20"
      y="20"
      width="80"
      height="80"
      rx="15"
      ry="15"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
  mystic: (color: string) => (
    <ellipse
      cx="60"
      cy="60"
      rx="45"
      ry="55"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
};

// === EYES (big anime style) ===
export const Eyes = {
  round: (color: string) => (
    <g>
      <circle cx="45" cy="50" r="12" fill="white" stroke="black" strokeWidth={2}/>
      <circle cx="45" cy="50" r="6" fill={color}/>
      <circle cx="75" cy="50" r="12" fill="white" stroke="black" strokeWidth={2}/>
      <circle cx="75" cy="50" r="6" fill={color}/>
      {/* highlight */}
      <circle cx="42" cy="47" r="2" fill="white"/>
      <circle cx="72" cy="47" r="2" fill="white"/>
    </g>
  ),
  fierce: (color: string) => (
    <g>
      <path d="M35,45 Q45,40 55,45 Q45,55 35,45Z" fill="white" stroke="black" strokeWidth={2}/>
      <circle cx="45" cy="47" r="4" fill={color}/>
      <path d="M65,45 Q75,40 85,45 Q75,55 65,45Z" fill="white" stroke="black" strokeWidth={2}/>
      <circle cx="75" cy="47" r="4" fill={color}/>
    </g>
  ),
};

// === MOUTHS ===
export const Mouths = {
  smile: () => (
    <path d="M45,75 Q60,85 75,75" stroke="black" strokeWidth={2} fill="transparent"/>
  ),
  fang: () => (
    <g>
      <path d="M45,75 Q60,90 75,75" stroke="black" strokeWidth={2} fill="transparent"/>
      <polygon points="55,75 58,85 61,75" fill="white" stroke="black" strokeWidth={1}/>
      <polygon points="65,75 68,85 71,75" fill="white" stroke="black" strokeWidth={1}/>
    </g>
  ),
};

// === ACCESSORIES (anime digimon vibes) ===
export const Accessories = {
  horn: (color: string) => (
    <path
      d="M60,5 L70,30 L50,30Z"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
  wing: (color: string) => (
    <path
      d="M20,40 Q0,20 10,10 Q30,20 20,40Z"
      fill={color}
      stroke="black"
      strokeWidth={2}
    />
  ),
  tail: (color: string) => (
    <path
      d="M100,70 Q120,80 110,100"
      stroke={color}
      strokeWidth={4}
      fill="none"
    />
  ),
};