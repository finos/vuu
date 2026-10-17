import cx from "clsx";
import { type RefObject, useEffect, useState } from "react";
import { scrollToHeading } from "../../mdx-components";

export interface TocEntry {
  id: string;
  level: 2 | 3;
  text: string;
}

/** h2 and h3 headings in a document, in document order */
export const readTocEntries = (article: HTMLElement): TocEntry[] =>
  Array.from(article.querySelectorAll<HTMLElement>("h2[id], h3[id]")).map(
    (heading) => ({
      id: heading.id,
      level: heading.tagName === "H2" ? 2 : 3,
      text: heading.textContent ?? "",
    }),
  );

/** headings above this fraction of the scroll viewport have been reached */
const READING_LINE = 0.25;

/**
 * The id of the heading being read, the last heading above the reading line.
 * Updated as the document scrolls.
 */
const useActiveHeading = (
  entries: TocEntry[],
  scrollRef: RefObject<HTMLElement | null>,
) => {
  const [activeId, setActiveId] = useState<string>();
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || entries.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = scrollContainer.getBoundingClientRect();
      const readingLine = top + height * READING_LINE;
      const atEnd =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 2;
      let active = entries[0].id;
      for (const { id } of entries) {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top <= readingLine) {
          active = id;
        }
      }
      setActiveId(atEnd ? entries[entries.length - 1].id : active);
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [entries, scrollRef]);
  return activeId;
};

const classBase = "ShowcaseDocsToc";

export interface DocsTocProps {
  entries: TocEntry[];
  scrollRef: RefObject<HTMLElement | null>;
}

/** "On this page", highlights the section being read */
export const DocsToc = ({ entries, scrollRef }: DocsTocProps) => {
  const activeId = useActiveHeading(entries, scrollRef);
  return entries.length > 0 ? (
    <nav aria-label="On this page" className={classBase}>
      <div className="ShowcaseDocsRail-title">On this page</div>
      <ul className={`${classBase}-list`}>
        {entries.map(({ id, level, text }) => (
          <li key={id}>
            <a
              aria-current={id === activeId ? "location" : undefined}
              className={cx(`${classBase}-link`, `${classBase}-level${level}`)}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToHeading(id, "smooth");
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ) : null;
};
