import { Button } from "@salt-ds/core";
import { ChevronDownIcon, CopyIcon, SuccessTickIcon } from "@salt-ds/icons";
import cx from "clsx";
import {
  Children,
  isValidElement,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import "./LivePreview.css";

export interface LivePreviewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Show the code when the page loads. By default it is hidden until the
   * user clicks "Show code".
   */
  defaultShowCode?: boolean;
  /**
   * Lay children out in a column with a gap between them, useful when an
   * example renders controls alongside a Table.
   */
  stacked?: boolean;
}

const classBase = "vuuDocsLivePreview";

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

/**
 * A fenced code block renders as <pre><code className="language-xxx">.
 */
const isCodeBlock = (node: ReactNode) => {
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const code = node.props.children;
    return (
      node.type === "pre" ||
      (isValidElement<{ className?: string }>(code) &&
        /language-/.test(code.props.className ?? ""))
    );
  }
  return false;
};

/**
 * Frames a live example within a documentation page. Fenced code blocks
 * placed inside the LivePreview (after the example) are shown in a
 * collapsible panel beneath it, e.g
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
  className,
  defaultShowCode = false,
  stacked = false,
  ...htmlAttributes
}: LivePreviewProps) => {
  const [showCode, setShowCode] = useState(defaultShowCode);
  const [copied, setCopied] = useState(false);

  const preview: ReactNode[] = [];
  const code: ReactNode[] = [];
  Children.toArray(children).forEach((child) =>
    (isCodeBlock(child) ? code : preview).push(child),
  );

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
    <div
      {...htmlAttributes}
      className={cx(classBase, className, {
        [`${classBase}-withCode`]: code.length > 0,
      })}
    >
      <div
        className={cx(`${classBase}-preview`, {
          [`${classBase}-stacked`]: stacked,
        })}
      >
        {preview}
      </div>
      {code.length > 0 ? (
        <>
          <div className={`${classBase}-toolbar`}>
            {showCode ? (
              <Button
                appearance="transparent"
                aria-label={copied ? "Copied" : "Copy code"}
                onClick={handleCopy}
                sentiment="neutral"
              >
                {copied ? (
                  <SuccessTickIcon aria-hidden />
                ) : (
                  <CopyIcon aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            ) : null}
            <Button
              appearance="transparent"
              aria-expanded={showCode}
              onClick={() => setShowCode((show) => !show)}
              sentiment="neutral"
            >
              <ChevronDownIcon
                aria-hidden
                className={cx(`${classBase}-chevron`, {
                  [`${classBase}-chevron-open`]: showCode,
                })}
              />
              {showCode ? "Hide code" : "Show code"}
            </Button>
          </div>
          {showCode ? <div className={`${classBase}-code`}>{code}</div> : null}
        </>
      ) : null}
    </div>
  );
};
