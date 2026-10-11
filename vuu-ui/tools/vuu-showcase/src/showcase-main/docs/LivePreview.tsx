import cx from "clsx";
import {
  Children,
  Fragment,
  isValidElement,
  type MouseEvent,
  type ReactNode,
  useState,
} from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { useDocsContext } from "./DocsContext";
import { embeddedExampleRoute } from "./docs-model";
import { isEmbeddedExample } from "./EmbeddedExample";

export interface LivePreviewProps {
  children?: ReactNode;
  /** Show the code tab when the page loads */
  defaultShowCode?: boolean;
  /** Lay out multiple examples in a column, with a gap between them */
  stacked?: boolean;
}

type Tab = "preview" | "code";

const classBase = "ShowcaseLivePreview";

const textContent = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textContent(child.props.children)
          : "",
    )
    .join("");

/** Shiki wraps each highlighted code block in a Fragment, unwrap these */
const flattenFragments = (node: ReactNode): ReactNode[] =>
  Children.toArray(node).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenFragments(child.props.children)
      : [child],
  );

/**
 * A fenced code block renders as <pre><code className="language-xxx">,
 * or as <pre className="shiki ..."> when syntax highlighted by Shiki.
 */
const isCodeBlock = (node: ReactNode) => {
  if (isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    const code = node.props.children;
    return (
      node.type === "pre" ||
      /\bshiki\b/.test(node.props.className ?? "") ||
      (isValidElement<{ className?: string }>(code) &&
        /language-/.test(code.props.className ?? ""))
    );
  }
  return false;
};

const isWhitespace = (node: ReactNode) =>
  typeof node === "string" && node.trim() === "";

/**
 * Frames live examples within a document, as a card with Preview and Code
 * tabs. Fenced code blocks placed inside the LivePreview are shown in the
 * Code tab, e.g
 *
 * <LivePreview>
 *   <MyExample />
 *
 * ```tsx
 * export const MyExample = () => ...
 * ```
 *
 * </LivePreview>
 */
export const LivePreview = ({
  children,
  defaultShowCode = false,
  stacked = false,
}: LivePreviewProps) => {
  const { docRoute, documentPath, hrefForRoute, navigateTo } = useDocsContext();
  const [tab, setTab] = useState<Tab>(defaultShowCode ? "code" : "preview");
  const [copied, setCopied] = useState(false);

  const preview: ReactNode[] = [];
  const code: ReactNode[] = [];
  flattenFragments(children).forEach((child) => {
    if (!isWhitespace(child)) {
      (isCodeBlock(child) ? code : preview).push(child);
    }
  });
  const examples = preview.filter(isEmbeddedExample).map(({ props }) => ({
    name: props.name,
    route: embeddedExampleRoute(
      docRoute,
      documentPath,
      props.module,
      props.name,
    ),
  }));
  const [firstExample] = examples;

  const handleCopy = () => {
    navigator.clipboard?.writeText(code.map(textContent).join("\n")).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  const handleOpenExample = (evt: MouseEvent<HTMLAnchorElement>) => {
    if (firstExample && !evt.metaKey && !evt.ctrlKey && !evt.shiftKey) {
      evt.preventDefault();
      navigateTo(firstExample.route);
    }
  };

  return (
    <section className={classBase}>
      <header className={`${classBase}-header`}>
        <ChromeIcon className={`${classBase}-icon`} name="examples" size={14} />
        <span className={`${classBase}-name`}>
          {examples.map(({ name }) => name).join(", ") || "Example"}
        </span>
        <span className={`${classBase}-live`}>· live example</span>
        <span className={`${classBase}-spacer`} />
        {tab === "code" ? (
          <button
            className={`${classBase}-action`}
            onClick={handleCopy}
            type="button"
          >
            <ChromeIcon name={copied ? "check" : "copy"} size={14} />
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
        {code.length > 0 ? (
          <div
            aria-label="View"
            className={`${classBase}-tabs ShowcaseSegmented`}
            role="tablist"
          >
            {(["preview", "code"] as Tab[]).map((value) => (
              <button
                aria-selected={tab === value}
                className={`${classBase}-tab`}
                key={value}
                onClick={() => setTab(value)}
                role="tab"
                type="button"
              >
                {value === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
        ) : null}
        {firstExample ? (
          <a
            aria-label={`Open ${firstExample.name} example`}
            className={`${classBase}-open ShowcaseIconButton`}
            href={hrefForRoute(firstExample.route)}
            onClick={handleOpenExample}
            title="Open example"
          >
            <ChromeIcon name="external" size={14} />
          </a>
        ) : null}
      </header>
      {/* the preview stays mounted, so switching tabs doesn't reload it */}
      <div
        className={cx(`${classBase}-preview`, {
          [`${classBase}-stacked`]: stacked,
        })}
        hidden={tab !== "preview"}
      >
        {preview}
      </div>
      {tab === "code" ? (
        <div className={`${classBase}-code`}>{code}</div>
      ) : null}
    </section>
  );
};
