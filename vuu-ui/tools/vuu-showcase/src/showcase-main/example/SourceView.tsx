import cx from "clsx";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { getSourceLinks } from "./example-model";
import { SHOWCASE_SOURCE_ROOT } from "./source-root";
import {
  getSourceLines,
  type HighlightedSource,
  type SourceScope,
  sourceText,
} from "./source-url";
import { useHighlightedSource } from "./useHighlightedSource";

import "./SourceView.css";

const classBase = "ShowcaseSource";

const ITALIC = 1;
const BOLD = 2;
const UNDERLINE = 4;

const tokenStyles = (styles: HighlightedSource["styles"]) =>
  styles.map(
    ([light, dark, fontStyle]) =>
      ({
        "--showcaseSource-light": light || undefined,
        "--showcaseSource-dark": dark || undefined,
        fontStyle: fontStyle & ITALIC ? "italic" : undefined,
        fontWeight: fontStyle & BOLD ? 600 : undefined,
        textDecoration: fontStyle & UNDERLINE ? "underline" : undefined,
      }) as CSSProperties,
  );

const fileName = (path = "") => path.split("/").pop() ?? path;

export interface SourceViewProps {
  className?: string;
  nodeData: NavNodeData;
}

/**
 * Source of an example, highlighted at build time (or on request by the dev
 * server). Shows just the example, or the whole file.
 */
export const SourceView = ({ className, nodeData }: SourceViewProps) => {
  const { path, sourceRange } = nodeData;
  const state = useHighlightedSource(path);
  const [scope, setScope] = useState<SourceScope>("example");
  const [copied, setCopied] = useState(false);
  const links = getSourceLinks(nodeData, SHOWCASE_SOURCE_ROOT);

  const source = state.status === "loaded" ? state.source : undefined;
  const lines = useMemo(
    () => (source ? getSourceLines(source, scope, sourceRange) : []),
    [scope, source, sourceRange],
  );
  const styles = useMemo(
    () => (source ? tokenStyles(source.styles) : []),
    [source],
  );
  const [start = 0, end = 0] = sourceRange ?? [];
  const isHighlighted = (lineNumber: number) =>
    scope === "file" && lineNumber >= start && lineNumber <= end;

  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // bring the example into view within the whole file
    const scroller = scrollerRef.current;
    const firstLine = scroller?.querySelector<HTMLElement>(
      `.${classBase}-line-highlighted`,
    );
    if (scroller) {
      scroller.scrollTop = firstLine
        ? Math.max(0, firstLine.offsetTop - scroller.clientHeight / 4)
        : 0;
    }
  }, [lines]);

  const copy = () =>
    navigator.clipboard?.writeText(sourceText(lines)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });

  return (
    <div className={cx(classBase, className)}>
      <div className={`${classBase}-toolbar`}>
        <span className={`${classBase}-file`} title={path}>
          <ChromeIcon name="code" size={14} />
          {fileName(path)}
        </span>
        {sourceRange ? (
          <div className="ShowcaseSegmented" role="group" aria-label="Show">
            <button
              aria-pressed={scope === "example"}
              onClick={() => setScope("example")}
              type="button"
            >
              This example
            </button>
            <button
              aria-pressed={scope === "file"}
              onClick={() => setScope("file")}
              type="button"
            >
              Whole file
            </button>
          </div>
        ) : null}
        <div className={`${classBase}-actions`}>
          <button
            className="ShowcaseButton"
            disabled={lines.length === 0}
            onClick={copy}
            type="button"
          >
            <ChromeIcon name={copied ? "check" : "copy"} />
            {copied ? "Copied" : "Copy"}
          </button>
          {links.github ? (
            <a
              className="ShowcaseButton"
              href={links.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ChromeIcon name="github" />
              GitHub
            </a>
          ) : null}
          {links.vscode ? (
            <a className="ShowcaseButton" href={links.vscode}>
              <ChromeIcon name="code" />
              VS Code
            </a>
          ) : null}
        </div>
      </div>
      <div className={`${classBase}-scroller`} ref={scrollerRef}>
        {state.status === "loading" ? (
          <div className={`${classBase}-message`}>Loading source…</div>
        ) : state.status === "error" ? (
          <div className={`${classBase}-message`}>
            Source unavailable: {state.message}
          </div>
        ) : (
          <pre className={`${classBase}-code`}>
            {lines.map(({ number, tokens }) => (
              <div
                className={cx(`${classBase}-line`, {
                  [`${classBase}-line-highlighted`]: isHighlighted(number),
                })}
                key={number}
              >
                <span aria-hidden className={`${classBase}-lineNumber`}>
                  {number}
                </span>
                <code>
                  {tokens.map(([text, style], i) => (
                    <span key={i} style={styles[style]}>
                      {text}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
};
