import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import cx from "clsx";
import {
  Children,
  Fragment,
  isValidElement,
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
  const { docRoute, documentPath, navigateTo } = useDocsContext();
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
          <Button
            appearance="transparent"
            className={`${classBase}-action`}
            onClick={handleCopy}
          >
            <ChromeIcon name={copied ? "check" : "copy"} size={14} />
            {copied ? "Copied" : "Copy"}
          </Button>
        ) : null}
        {code.length > 0 ? (
          <ToggleButtonGroup
            aria-label="View"
            className={`${classBase}-tabs`}
            onChange={(e) => setTab(e.currentTarget.value as Tab)}
            value={tab}
          >
            <ToggleButton value="preview">Preview</ToggleButton>
            <ToggleButton value="code">Code</ToggleButton>
          </ToggleButtonGroup>
        ) : null}
        {firstExample ? (
          <Button
            appearance="transparent"
            aria-label={`Open ${firstExample.name} example`}
            className={`${classBase}-open`}
            onClick={() => navigateTo(firstExample.route)}
            title="Open example"
          >
            <ChromeIcon name="external" size={14} />
          </Button>
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
