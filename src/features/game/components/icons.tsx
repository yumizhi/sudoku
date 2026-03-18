import type { JSX } from "react";

interface IconProps {
  className?: string;
}

function iconClassName(className?: string): string {
  return ["h-5 w-5", className].filter(Boolean).join(" ");
}

export function UndoIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H4v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 17a8 8 0 0 0-8-8H4" />
    </svg>
  );
}

export function RedoIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h5v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17a8 8 0 0 1 8-8h8" />
    </svg>
  );
}

export function EraserIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 14 6.5-6.5a2.5 2.5 0 0 1 3.5 0l2 2a2.5 2.5 0 0 1 0 3.5L12 20H7a2 2 0 0 1-1.4-.6l-1-1a2 2 0 0 1 0-2.8L7 13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20h10" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

export function HintIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 22h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V17h6v-.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function NewGameIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M15 4v16M4 9h16M4 15h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5v5M16.5 7.5H21.5" />
    </svg>
  );
}

export function TutorialIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
