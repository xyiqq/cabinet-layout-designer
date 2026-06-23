"use client";

import { useId } from "react";

export type SkeuoIconName =
  | "add"
  | "auto"
  | "breaker"
  | "cabinet"
  | "cancel"
  | "clear"
  | "csv"
  | "delete"
  | "device"
  | "dimension"
  | "export"
  | "image"
  | "json"
  | "module"
  | "moveDown"
  | "moveUp"
  | "network"
  | "power"
  | "rack"
  | "sample"
  | "save"
  | "settings"
  | "terminal"
  | "tray"
  | "undo"
  | "warning";

interface SkeuoIconProps {
  name: SkeuoIconName;
  size?: number;
  className?: string;
}

function iconTone(name: SkeuoIconName) {
  if (name === "delete" || name === "clear" || name === "warning" || name === "cancel") return "#c44935";
  if (name === "add" || name === "save" || name === "auto") return "#2f8f6a";
  if (name === "power" || name === "breaker") return "#c79435";
  if (name === "network" || name === "rack" || name === "image") return "#2d7696";
  if (name === "terminal" || name === "settings" || name === "tray") return "#66717c";
  return "#7567aa";
}

export function SkeuoIcon({ name, size = 20, className = "" }: SkeuoIconProps) {
  const rawId = useId().replace(/:/g, "");
  const tone = iconTone(name);
  const id = (part: string) => `${rawId}-${name}-${part}`;
  const isCommand = [
    "add",
    "auto",
    "cancel",
    "clear",
    "csv",
    "delete",
    "dimension",
    "export",
    "image",
    "json",
    "moveDown",
    "moveUp",
    "sample",
    "save",
    "settings",
    "undo",
    "warning"
  ].includes(name);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`skeuo-icon ${className}`}
    >
      <defs>
        <linearGradient id={id("shell")} x1="14" y1="6" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.48" stopColor="#e9edf0" />
          <stop offset="1" stopColor="#aab3bc" />
        </linearGradient>
        <linearGradient id={id("face")} x1="18" y1="13" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.58" stopColor="#f4f0e6" />
          <stop offset="1" stopColor="#d4c2a1" />
        </linearGradient>
        <linearGradient id={id("tone")} x1="20" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.2" stopColor={tone} stopOpacity="0.95" />
          <stop offset="1" stopColor="#17202a" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="20" y1="14" x2="42" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id={id("led")} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#f2ffe8" />
          <stop offset="0.42" stopColor="#9be071" />
          <stop offset="1" stopColor="#2f8f6a" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="57" rx="20" ry="4.5" fill="#17202a" opacity="0.16" />
      <rect x="9" y="6" width="46" height="50" rx="11" fill={`url(#${id("shell")})`} />
      <rect x="12" y="9" width="40" height="44" rx="9" fill={`url(#${id("face")})`} />
      <path d="M15 13h34v9c-8.8-3.2-21.7-2.3-34 1.4Z" fill={`url(#${id("glass")})`} />

      {isCommand ? (
        <rect x="18" y="17" width="28" height="28" rx="7" fill={`url(#${id("tone")})`} stroke="#ffffff" strokeOpacity="0.58" />
      ) : null}

      {name === "cabinet" ? (
        <>
          <rect x="19" y="15" width="26" height="34" rx="4" fill="#e6d7b9" stroke="#7f7058" strokeWidth="2" />
          <rect x="23" y="20" width="18" height="7" rx="2" fill="#26303b" />
          <rect x="24" y="32" width="16" height="4" rx="2" fill="#b58a3b" />
          <rect x="24" y="38" width="16" height="5" rx="2" fill="#dfe5e8" stroke="#9aa4ad" />
          <circle cx="42" cy="31" r="2" fill="#7c5d24" />
        </>
      ) : null}

      {name === "rack" ? (
        <>
          <rect x="18" y="14" width="28" height="36" rx="4" fill="#202a35" stroke="#0f172a" strokeWidth="2" />
          {Array.from({ length: 5 }).map((_, index) => (
            <rect key={index} x="22" y={18 + index * 6} width="20" height="3.4" rx="1.2" fill={index % 2 ? "#425061" : "#2d7696"} />
          ))}
          <circle cx="23" cy="46" r="1.8" fill={`url(#${id("led")})`} />
        </>
      ) : null}

      {name === "network" ? (
        <>
          <rect x="17" y="22" width="30" height="20" rx="4" fill="#2d7696" stroke="#17485d" strokeWidth="2" />
          {Array.from({ length: 4 }).map((_, index) => (
            <rect key={index} x={21 + index * 6} y="29" width="4" height="5" rx="1" fill="#d9edf4" />
          ))}
          <circle cx="42" cy="28" r="2" fill={`url(#${id("led")})`} />
          <path d="M19 23h25v5c-8-2.7-16.8-2.4-25 .8Z" fill="#ffffff" opacity="0.28" />
        </>
      ) : null}

      {name === "breaker" ? (
        <>
          <rect x="21" y="15" width="22" height="34" rx="5" fill="#f2f4f5" stroke="#8c97a1" strokeWidth="2" />
          <rect x="25" y="20" width="14" height="8" rx="2" fill="#c44935" />
          <path d="M29 32h7l-4 12h-7Z" fill="#2f3540" />
          <circle cx="32" cy="18.5" r="1.6" fill="#ffffff" />
        </>
      ) : null}

      {name === "terminal" ? (
        <>
          <rect x="17" y="22" width="30" height="19" rx="4" fill="#d8dde1" stroke="#66717c" strokeWidth="2" />
          {Array.from({ length: 5 }).map((_, index) => (
            <g key={index}>
              <rect x={20 + index * 5} y="25" width="4" height="13" rx="1" fill="#f8fafb" />
              <circle cx={22 + index * 5} cy="31.5" r="1.2" fill="#66717c" />
            </g>
          ))}
        </>
      ) : null}

      {name === "power" ? (
        <>
          <rect x="18" y="18" width="28" height="26" rx="5" fill="#c79435" stroke="#7c5d24" strokeWidth="2" />
          <path d="M34 18 25 34h7l-3 13 11-18h-7Z" fill="#fff3c6" stroke="#7c5d24" strokeWidth="1" />
          <rect x="21" y="22" width="22" height="4" rx="2" fill="#ffffff" opacity="0.28" />
        </>
      ) : null}

      {name === "module" || name === "device" ? (
        <>
          <rect x="20" y="16" width="24" height="32" rx="5" fill="#6d5fa8" stroke="#4c407d" strokeWidth="2" />
          <rect x="24" y="21" width="16" height="5" rx="1.5" fill="#eef2ff" />
          <rect x="25" y="31" width="14" height="10" rx="2" fill="#342f52" opacity="0.9" />
          <circle cx="28" cy="44" r="1.7" fill={`url(#${id("led")})`} />
        </>
      ) : null}

      {name === "tray" ? (
        <>
          <path d="M19 25h26l-3 15H22Z" fill="#d8dde1" stroke="#66717c" strokeWidth="2" />
          <path d="M22 25 19 19h26l-3 6Z" fill="#f8fafb" stroke="#9aa4ad" strokeWidth="1.5" />
          <rect x="23" y="33" width="18" height="3" rx="1.5" fill="#9aa4ad" />
        </>
      ) : null}

      {name === "add" ? <path d="M32 21v22M21 32h22" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" /> : null}
      {name === "delete" ? (
        <>
          <path d="M22 25h20M27 25l1-4h8l1 4M26 29l2 14h8l2-14" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 32v8M34 32v8" stroke="#ffd8d2" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
      {name === "export" ? <path d="M32 20v17M24 28l8-8 8 8M22 40h20" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === "image" ? (
        <>
          <rect x="23" y="23" width="18" height="17" rx="2" fill="#ffffff" opacity="0.92" />
          <path d="M24 38 30 31l4 4 3-3 4 6Z" fill="#2d7696" />
          <circle cx="36.5" cy="28" r="2" fill="#c79435" />
        </>
      ) : null}
      {name === "csv" || name === "json" ? (
        <>
          <path d="M26 20h10l6 6v18H26Z" fill="#ffffff" opacity="0.92" />
          <path d="M36 20v7h6" fill="none" stroke="#7567aa" strokeWidth="2" />
          <text x="32" y="39" textAnchor="middle" fontSize="9" fontWeight="700" fill="#17202a">
            {name.toUpperCase()}
          </text>
        </>
      ) : null}
      {name === "auto" ? (
        <>
          <path d="M22 34c0-6 4.5-10 10-10 3.6 0 6.4 1.7 8 4.3" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 23v8h-8" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="27" cy="38" r="2" fill="#d7ffe8" />
          <circle cx="35" cy="38" r="2" fill="#d7ffe8" />
        </>
      ) : null}
      {name === "sample" ? (
        <>
          <rect x="23" y="23" width="18" height="18" rx="3" fill="#ffffff" opacity="0.92" />
          <path d="M27 29h10M27 34h10M27 39h6" stroke="#7567aa" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
      {name === "clear" || name === "cancel" ? <path d="M24 24 40 40M40 24 24 40" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" /> : null}
      {name === "save" ? (
        <>
          <path d="M23 22h18v20H23Z" fill="#ffffff" opacity="0.92" />
          <rect x="27" y="24" width="9" height="6" fill="#2f8f6a" />
          <rect x="27" y="35" width="10" height="5" rx="1" fill="#17202a" opacity="0.78" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <circle cx="32" cy="32" r="8" fill="#ffffff" opacity="0.9" />
          <circle cx="32" cy="32" r="3.5" fill="#66717c" />
          {Array.from({ length: 6 }).map((_, index) => {
            const angle = (Math.PI * 2 * index) / 6;
            return (
              <rect
                key={index}
                x={31 + Math.cos(angle) * 11}
                y={31 + Math.sin(angle) * 11}
                width="2.5"
                height="2.5"
                rx="1"
                fill="#ffffff"
              />
            );
          })}
        </>
      ) : null}
      {name === "moveUp" || name === "moveDown" ? (
        <path
          d={name === "moveUp" ? "M32 21 22 33h7v10h6V33h7Z" : "M32 43 22 31h7V21h6v10h7Z"}
          fill="#ffffff"
        />
      ) : null}
      {name === "undo" ? <path d="M26 25h-7v-7M20 25c4-5 10-7 16-4 5 2 8 7 7 13-1 7-7 11-14 10" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === "dimension" ? (
        <>
          <path d="M23 40h18M23 40v-5M41 40v-5M25 24h14v10H25Z" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m27 28 10 0" stroke="#ffffff" strokeWidth="2" />
        </>
      ) : null}
      {name === "warning" ? (
        <>
          <path d="M32 20 44 42H20Z" fill="#fff3c6" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 27v7" stroke="#9a2c21" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="38" r="1.8" fill="#9a2c21" />
        </>
      ) : null}

      <path d="M16 12h32" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 46c8 4 22 5 36-1" stroke="#17202a" strokeOpacity="0.12" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
