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
  "arrow-left": <path d="M14.5 9h-11M7.5 5l-4 4 4 4" />,
  "chevron-right": <path d="m7 4.5 4.5 4.5L7 13.5" />,
  "chevron-down": <path d="m4.5 7 4.5 4.5L13.5 7" />,
  selector: <path d="m6 7 3-3 3 3M6 11l3 3 3-3" />,
  check: <path d="m4 9.5 3.25 3.25L14 6" />,
  copy: (
    <>
      <rect x="6.5" y="6.5" width="8.5" height="8.5" rx="1.5" />
      <path d="M11.5 6.5V4.5A1.5 1.5 0 0 0 10 3H4.5A1.5 1.5 0 0 0 3 4.5V10a1.5 1.5 0 0 0 1.5 1.5h2" />
    </>
  ),
  link: (
    <path d="M7.75 10.25a3 3 0 0 0 4.24 0l2.13-2.12a3 3 0 0 0-4.25-4.25l-.7.7M10.25 7.75a3 3 0 0 0-4.24 0L3.88 9.87a3 3 0 0 0 4.25 4.25l.7-.7" />
  ),
  code: <path d="M6 5 2 9l4 4M12 5l4 4-4 4" />,
  refresh: (
    <path d="M14.5 4v3.5H11M3.5 14v-3.5H7M4.2 7a5.25 5.25 0 0 1 9.55-.9l.75 1.4M13.8 11a5.25 5.25 0 0 1-9.55.9l-.75-1.4" />
  ),
  external: (
    <path d="M10.5 3H15v4.5M15 3l-6.5 6.5M13 10.5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.5" />
  ),
  fill: <path d="M3 6.5V3h3.5M11.5 3H15v3.5M15 11.5V15h-3.5M6.5 15H3v-3.5" />,
  monitor: (
    <>
      <rect x="2.5" y="3" width="13" height="9" rx="1" />
      <path d="M6.5 15.5h5M9 12v3.5" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="4" width="10" height="7" rx="1" />
      <path d="M2 14h14" />
    </>
  ),
  tablet: (
    <>
      <rect x="4.5" y="2.5" width="9" height="13" rx="1.5" />
      <path d="M8 13h2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="9" cy="4.5" rx="5" ry="2" />
      <path d="M4 4.5v9c0 1.1 2.24 2 5 2s5-.9 5-2v-9M4 9c0 1.1 2.24 2 5 2s5-.9 5-2" />
    </>
  ),
  plug: (
    <path d="M6.5 2.5V6M11.5 2.5V6M4.5 6h9v2.5a4.5 4.5 0 0 1-9 0zM9 13v3" />
  ),
  "source-panel": (
    <>
      <rect x="2.5" y="3" width="13" height="12" rx="1.5" />
      <path d="M2.5 10.5h13M5.5 12.75h4" />
    </>
  ),
  flask: (
    <path d="M7 2.5h4M7.5 2.5v4.25L3.6 13.4a1.4 1.4 0 0 0 1.2 2.1h8.4a1.4 1.4 0 0 0 1.2-2.1L10.5 6.75V2.5M5.25 10.5h7.5" />
  ),
  bolt: <path d="M10 2 4 10.5h5L8 16l6-8.5H9z" />,
  moon: <path d="M14.5 10.6A6 6 0 0 1 7.4 3.5a6 6 0 1 0 7.1 7.1z" />,
  github: (
    <path d="M7 14.5c-3 .9-3-1.5-4.2-1.8M11 16.5v-2.6a2.3 2.3 0 0 0-.6-1.7c2.1-.2 4.2-1 4.2-4.6a3.6 3.6 0 0 0-1-2.5 3.3 3.3 0 0 0 0-2.5s-.8-.2-2.6 1a9 9 0 0 0-4.6 0C4.6 2.4 3.8 2.6 3.8 2.6a3.3 3.3 0 0 0 0 2.5 3.6 3.6 0 0 0-1 2.5c0 3.6 2.1 4.4 4.2 4.6a2.3 2.3 0 0 0-.6 1.7v2.6" />
  ),
  info: (
    <>
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 8.25v4M9 5.75v.01" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M6.75 13h4.5M7.5 15.5h3" />
      <path d="M9 2.5a4.5 4.5 0 0 0-2.6 8.15c.4.3.6.7.6 1.15V13h4v-1.2c0-.45.2-.85.6-1.15A4.5 4.5 0 0 0 9 2.5z" />
    </>
  ),
  warning: (
    <>
      <path d="M7.7 3.25 2.4 12.6A1.5 1.5 0 0 0 3.7 14.85h10.6a1.5 1.5 0 0 0 1.3-2.25L10.3 3.25a1.5 1.5 0 0 0-2.6 0z" />
      <path d="M9 7v3M9 12.25v.01" />
    </>
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
