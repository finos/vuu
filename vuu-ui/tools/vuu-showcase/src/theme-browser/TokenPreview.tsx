import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { CSSProperties, ReactNode } from "react";
import { Axes, isRadius } from "./model-utils";
import { useThemeBrowser } from "./ThemeBrowserContext";

const ICONS: Record<string, string> = {
  duration: "◷",
  easing: "∿",
  animation: "▶",
  "z-index": "⧉",
  cursor: "↖",
  typography: "T",
  number: "#",
};

export interface TokenPreviewProps {
  axes?: Axes;
  size?: "xs" | "sm" | "lg";
  token: ThemeToken;
}

const Fill = ({
  className,
  style,
}: {
  className?: string;
  style: CSSProperties;
}) => <span className={cx("fill", className)} style={style} />;

/** a visualisation of a token value appropriate to its category */
export const TokenPreview = ({
  axes,
  size = "sm",
  token,
}: TokenPreviewProps) => {
  const { resolve } = useThemeBrowser();
  const value = resolve(token.name, axes);
  const className = cx("preview", `preview-${size}`);

  let content: ReactNode = null;
  let variant = "glyph";
  switch (token.category) {
    case "color":
      variant = "checker";
      content = <Fill style={{ background: value }} />;
      break;
    case "color-channels":
      variant = "checker";
      content = <Fill style={{ background: value ? `rgb(${value})` : "" }} />;
      break;
    case "opacity":
      variant = "checker";
      content = <Fill className="accent" style={{ opacity: value }} />;
      break;
    case "dimension":
      if (isRadius(token)) {
        return (
          <span
            className={cx(className, "radius")}
            style={{ borderTopLeftRadius: value }}
          />
        );
      }
      variant = "bar-track";
      content = (
        <span className="bar" style={{ width: `min(100%, ${value})` }} />
      );
      break;
    case "shadow":
      return (
        <span
          className={cx(className, "shadow")}
          style={{ boxShadow: value }}
        />
      );
    case "font-family":
      content = <span style={{ fontFamily: value }}>Aa</span>;
      break;
    case "font-weight":
      content = <span style={{ fontWeight: value }}>Aa</span>;
      break;
    case "border-style":
      content = (
        <span
          className="line"
          style={{ borderTopStyle: value as CSSProperties["borderTopStyle"] }}
        />
      );
      break;
    default:
      variant = "glyph icon";
      content = ICONS[token.category] ?? "·";
  }
  return <span className={cx(className, variant)}>{content}</span>;
};
