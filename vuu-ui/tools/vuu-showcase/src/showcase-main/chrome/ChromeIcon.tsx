import type { SVGAttributes } from "react";

const paths = {
  docs: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 15.5z" />
      <path d="M11 3v4h4M7 10h5M7 13h5" />
    </>
  ),
  examples: (
    <>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="10" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
    </>
  ),
  theme: (
    <>
      <path d="M9 2.5a6.5 6.5 0 0 0 0 13c.9 0 1.35-.55 1.35-1.2 0-.8-.65-1.1-.65-1.85 0-.7.6-1.2 1.3-1.2h1.4a3.1 3.1 0 0 0 3.1-3.1C15.5 5 12.6 2.5 9 2.5z" />
      <circle cx="5.75" cy="8.25" r=".8" />
      <circle cx="7.75" cy="5.4" r=".8" />
      <circle cx="11" cy="5.4" r=".8" />
    </>
  ),
  search: (
    <>
      <circle cx="8" cy="8" r="5" />
      <path d="m15 15-3.4-3.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.05 4.05l1.06 1.06M12.9 12.9l1.05 1.05M4.05 13.95l1.06-1.06M12.9 5.1l1.05-1.05" />
    </>
  ),
  filter: <path d="M3 4.5h12M5.5 9h7M7.5 13.5h3" />,
  star: (
    <path d="m9 2.75 1.9 3.9 4.3.6-3.1 3 .75 4.25L9 12.5l-3.85 2 .75-4.25-3.1-3 4.3-.6z" />
  ),
  clock: (
    <>
      <circle cx="9" cy="9" r="6.25" />
      <path d="M9 5.5V9l2.5 1.5" />
    </>
  ),
  close: <path d="m5 5 8 8M13 5l-8 8" />,
  "arrow-right": <path d="M3.5 9h11M10.5 5l4 4-4 4" />,
  moon: <path d="M14.5 10.6A6 6 0 0 1 7.4 3.5a6 6 0 1 0 7.1 7.1z" />,
  github: (
    <path d="M7 14.5c-3 .9-3-1.5-4.2-1.8M11 16.5v-2.6a2.3 2.3 0 0 0-.6-1.7c2.1-.2 4.2-1 4.2-4.6a3.6 3.6 0 0 0-1-2.5 3.3 3.3 0 0 0 0-2.5s-.8-.2-2.6 1a9 9 0 0 0-4.6 0C4.6 2.4 3.8 2.6 3.8 2.6a3.3 3.3 0 0 0 0 2.5 3.6 3.6 0 0 0-1 2.5c0 3.6 2.1 4.4 4.2 4.6a2.3 2.3 0 0 0-.6 1.7v2.6" />
  ),
} as const;

export type ChromeIconName = keyof typeof paths;

export interface ChromeIconProps extends SVGAttributes<SVGSVGElement> {
  name: ChromeIconName;
  size?: number;
}

/** Stroke icons for the showcase chrome, coloured with currentColor */
export const ChromeIcon = ({ name, size = 16, ...props }: ChromeIconProps) => (
  <svg
    aria-hidden
    className="ShowcaseChromeIcon"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 18 18"
    width={size}
    {...props}
  >
    {paths[name]}
  </svg>
);
