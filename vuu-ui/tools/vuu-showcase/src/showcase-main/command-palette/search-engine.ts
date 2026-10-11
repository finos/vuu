/**
 * A small search engine for the command palette. Each item has weighted text
 * fields. Every query term must match some field, as a whole word, a word
 * prefix, a substring or (for longer terms) a word one edit away. The score
 * of an item is the sum, over terms, of its best weighted match.
 */

export interface SearchField {
  text: string;
  weight: number;
}

interface IndexedField {
  /** lower case words, camelCase and kebab-case split */
  words: string[];
  /** lower case text with separators removed */
  compact: string;
  weight: number;
}

interface IndexedItem<T> {
  item: T;
  fields: IndexedField[];
  /** compact form of the first field, for whole query prefix bonus */
  title: string;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}

const EXACT = 1;
const PREFIX = 0.75;
const SUBSTRING = 0.4;
const FUZZY = 0.25;
const MIN_FUZZY_LENGTH = 4;

/** Splits text into lower case words, at separators and camelCase humps */
export const toWords = (text: string) =>
  text
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z\d]+/)
    .filter(Boolean);

/** Query terms, lower case and split at separators (but not camelCase) */
export const toTerms = (query: string) =>
  query
    .toLowerCase()
    .split(/[^a-z\d]+/)
    .filter(Boolean);

const compact = (text: string) => text.toLowerCase().replace(/[^a-z\d]/g, "");

/** True if a and b are within one edit (insert, delete, substitute, swap) */
export const withinOneEdit = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length || i === b.length) return true;
  const restA = a.slice(i + 1);
  const restB = b.slice(i + 1);
  return (
    restA === restB || // substitution
    a.slice(i) === b.slice(i + 1) || // insertion into a
    a.slice(i + 1) === b.slice(i) || // deletion from a
    (a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2))
  );
};

const matchTerm = (term: string, field: IndexedField) => {
  let best = 0;
  for (const word of field.words) {
    if (word === term) return EXACT;
    if (word.startsWith(term)) best = Math.max(best, PREFIX);
    else if (
      best < FUZZY &&
      term.length >= MIN_FUZZY_LENGTH &&
      (withinOneEdit(term, word) ||
        withinOneEdit(term, word.slice(0, term.length)))
    ) {
      best = FUZZY;
    }
  }
  if (best < SUBSTRING && field.compact.includes(term)) best = SUBSTRING;
  return best;
};

export class SearchIndex<T> {
  #items: IndexedItem<T>[];

  constructor(items: T[], fieldsOf: (item: T) => SearchField[]) {
    this.#items = items.map((item) => {
      const fields = fieldsOf(item).filter((f) => f.text);
      return {
        fields: fields.map(({ text, weight }) => ({
          compact: compact(text),
          weight,
          words: toWords(text),
        })),
        item,
        title: fields[0] ? compact(fields[0].text) : "",
      };
    });
  }

  get size() {
    return this.#items.length;
  }

  search(query: string): SearchResult<T>[] {
    const terms = toTerms(query);
    if (terms.length === 0) return [];
    const whole = terms.join("");
    const results: SearchResult<T>[] = [];
    for (const { fields, item, title } of this.#items) {
      let score = 0;
      for (const term of terms) {
        let termScore = 0;
        for (const field of fields) {
          termScore = Math.max(
            termScore,
            matchTerm(term, field) * field.weight,
          );
        }
        if (termScore === 0) {
          score = 0;
          break;
        }
        score += termScore;
      }
      if (score > 0) {
        // favour items whose title starts with, or is, the query
        if (title.startsWith(whole)) score *= title === whole ? 1.5 : 1.25;
        results.push({ item, score });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }
}

export interface TextSegment {
  text: string;
  match?: boolean;
}

/** Text split into segments, matching segments are occurrences of a term */
export const highlightText = (text: string, query: string): TextSegment[] => {
  const terms = toTerms(query);
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    for (
      let i = lower.indexOf(term);
      i !== -1;
      i = lower.indexOf(term, i + term.length)
    ) {
      ranges.push([i, i + term.length]);
    }
  }
  if (ranges.length === 0) return [{ text }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const segments: TextSegment[] = [];
  let from = 0;
  for (const [start, end] of merged) {
    if (start > from) segments.push({ text: text.slice(from, start) });
    segments.push({ match: true, text: text.slice(start, end) });
    from = end;
  }
  if (from < text.length) segments.push({ text: text.slice(from) });
  return segments;
};
