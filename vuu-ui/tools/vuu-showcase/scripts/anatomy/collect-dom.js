// Evaluated in the page by extract-anatomy.ts, as text, so that it is not
// transformed by tsx. It must be a single, self contained function expression.
//
// Collects the elements of a component, from the root element down, plus the
// ancestors of the root (which carry the theme), and for each element the
// css rules that match it. A rule that matches only in a state (e.g :hover)
// or applies to a pseudo element (e.g ::before) is matched with the state or
// pseudo element removed and reported as such.
({ rootSelector, prefer = [], nested = [] }) => {
  const root = document.querySelector(rootSelector);
  if (!root) {
    return { error: `no element matches ${rootSelector}` };
  }

  const STATES =
    /:(hover|active|focus-visible|focus-within|focus|checked|disabled|indeterminate|invalid|read-only|placeholder-shown|visited|target)(?![\w-])/g;
  const PSEUDO_ELEMENTS =
    /::?(before|after|placeholder|selection|marker|backdrop|first-line|first-letter|-webkit-[\w-]+|-moz-[\w-]+)(?![\w-])/g;

  /** top level comma separated parts of a selector list */
  const splitList = (text) => {
    const parts = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "(" || c === "[") depth += 1;
      else if (c === ")" || c === "]") depth -= 1;
      else if (c === "," && depth === 0) {
        parts.push(text.slice(from, i).trim());
        from = i + 1;
      }
    }
    parts.push(text.slice(from).trim());
    return parts.filter(Boolean);
  };

  /** declarations of a rule, shorthands as written (unlike style[i]) */
  const declarations = (style) => {
    const text = style.cssText;
    const result = [];
    let depth = 0;
    let quote = null;
    let from = 0;
    const push = (end) => {
      const decl = text.slice(from, end).trim();
      const colon = decl.indexOf(":");
      if (colon > 0) {
        const property = decl.slice(0, colon).trim();
        const value = decl
          .slice(colon + 1)
          .replace(/!important\s*$/, "")
          .trim();
        result.push([property, value]);
      }
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth += 1;
      else if (c === ")") depth -= 1;
      else if (c === ";" && depth === 0) {
        push(i);
        from = i + 1;
      }
    }
    push(text.length);
    return result;
  };

  /** selectors of a nested rule, made absolute, e.g &:hover => :is(.a):hover */
  const resolveNested = (selectors, parentSelectors) => {
    if (!parentSelectors) return selectors;
    const parent = `:is(${parentSelectors.join(", ")})`;
    return selectors.map((selector) =>
      selector.includes("&")
        ? selector.replaceAll("&", parent)
        : `${parent} ${selector}`,
    );
  };

  const styleRules = [];
  const collect = (list, parentSelectors) => {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule) {
        const selectors = resolveNested(
          splitList(rule.selectorText),
          parentSelectors,
        );
        styleRules.push({ rule, selectors });
        if (rule.cssRules?.length) collect(rule.cssRules, selectors);
      } else if (rule.constructor.name === "CSSNestedDeclarations") {
        // declarations that follow a nested rule, within the parent rule
        styleRules.push({ rule, selectors: parentSelectors });
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.media.mediaText).matches) {
          collect(rule.cssRules, parentSelectors);
        }
      } else if (rule instanceof CSSSupportsRule) {
        if (CSS.supports(rule.conditionText)) {
          collect(rule.cssRules, parentSelectors);
        }
      } else if (rule.cssRules) {
        // @layer, @container
        collect(rule.cssRules, parentSelectors);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      collect(sheet.cssRules);
    } catch {
      // cross origin stylesheet
    }
  }

  const matchSelector = (el, selector) => {
    try {
      if (el.matches(selector)) return { states: [] };
    } catch {
      return null;
    }
    const states = [];
    let pseudoElement;
    let stripped = selector
      .replace(PSEUDO_ELEMENTS, (_, name) => {
        pseudoElement = `::${name}`;
        return "";
      })
      .replace(STATES, (_, name) => {
        states.push(name);
        return "";
      });
    if (stripped === selector) return null;
    // a compound that was only a state, e.g `:hover > .x`, matches anything
    stripped = stripped.replace(/(^|[\s>+~(])(?=[\s>+~)]|$)/g, "$1*");
    // global rules, e.g `.salt-theme :focus-visible`, are not about the element
    if (/(^|[\s>+~])\*$/.test(stripped.trim())) return null;
    try {
      if (el.matches(stripped)) return { states, pseudoElement };
    } catch {
      // not a selector we can match
    }
    return null;
  };

  const ruleIndex = new Map();
  const rules = [];
  const rulesFor = (el, context) => {
    const matches = [];
    styleRules.forEach(({ rule, selectors }, order) => {
      for (const selector of selectors) {
        const match = matchSelector(el, selector);
        if (!match) continue;
        // context elements (ancestors of the root) only provide variables
        if (context && (match.states.length || match.pseudoElement)) continue;
        let index = ruleIndex.get(rule);
        if (index === undefined) {
          const decls = declarations(rule.style).filter(
            ([property, value]) =>
              property.startsWith("--") || value.includes("var("),
          );
          if (decls.length === 0) {
            ruleIndex.set(rule, -1);
            continue;
          }
          index = rules.length;
          ruleIndex.set(rule, index);
          rules.push({ order, decls });
        }
        if (index !== -1) {
          matches.push({ rule: index, selector, ...match });
        }
      }
    });
    return matches;
  };

  const rootRect = root.getBoundingClientRect();
  const elements = [];
  const nodes = [];

  const context = [];
  for (let el = root.parentElement; el; el = el.parentElement) {
    context.unshift(el);
  }
  context.forEach((el, i) => {
    nodes.push(el);
    const element = {
      context: true,
      parent: i - 1,
      tag: el.tagName.toLowerCase(),
      classes: [...el.classList],
      matches: rulesFor(el, true),
    };
    const inline = declarations(el.style).filter(([property]) =>
      property.startsWith("--"),
    );
    if (inline.length) element.inline = inline;
    elements.push(element);
  });

  const visit = (el, parent) => {
    const index = elements.length;
    const rect = el.getBoundingClientRect();
    const element = {
      parent,
      tag: el.tagName.toLowerCase(),
      classes: [...el.classList],
      rect: [
        rect.left - rootRect.left,
        rect.top - rootRect.top,
        rect.width,
        rect.height,
      ].map((n) => Math.round(n * 10) / 10),
      matches: rulesFor(el, false),
    };
    const role = el.getAttribute("role");
    if (role) element.role = role;
    const inline = declarations(el.style).filter(
      ([property, value]) =>
        property.startsWith("--") || value.includes("var("),
    );
    if (inline.length) element.inline = inline;
    if (el.getClientRects().length === 0) element.hidden = true;
    if (prefer.some((selector) => el.matches(selector))) {
      element.preferred = true;
    }
    const nestedComponent = nested.find(({ selector }) => el.matches(selector));
    if (nestedComponent) element.nested = nestedComponent.name;
    if (el.children.length === 0) {
      const text = el.textContent.trim();
      if (text) element.text = text.slice(0, 40);
    }
    element.computed = {};
    for (const { rule, pseudoElement } of element.matches) {
      for (const [property] of rules[rule].decls) {
        if (!property.startsWith("--")) {
          const key = pseudoElement ? `${pseudoElement} ${property}` : property;
          element.computed[key] = getComputedStyle(el, pseudoElement ?? null)
            .getPropertyValue(property)
            .trim();
        }
      }
    }
    for (const [property] of element.inline ?? []) {
      if (!property.startsWith("--")) {
        element.computed[property] = getComputedStyle(el)
          .getPropertyValue(property)
          .trim();
      }
    }
    nodes.push(el);
    elements.push(element);
    // the internals of a nested component are not part of this anatomy
    if (!nestedComponent) {
      for (const child of el.children) {
        visit(child, index);
      }
    }
  };
  visit(root, context.length - 1);

  // kept for computeVariables, below
  window.__anatomyNodes = nodes;

  return {
    rootIndex: context.length,
    size: [rootRect.width, rootRect.height].map(Math.round),
    elements,
    rules,
  };
};
