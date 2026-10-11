import { useEffect, useState } from "react";
import {
  effectivePropValue,
  type ExamplePropDef,
  type ExamplePropDefs,
  type ExamplePropValue,
  type ExamplePropValues,
  exampleToJsx,
  type MultiSelectPropDef,
  type NumberPropDef,
  type SelectPropDef,
} from "../../example-props";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeSelect } from "./ChromeSelect";
import type { ActionLogEntry } from "./useExampleProps";

import "./PropsPanel.css";

const classBase = "ShowcasePropsPanel";

// the union of options, unless too long, the control shows the options anyway
const unionLabel = (options: readonly string[]) => {
  const union = options.map((option) => `"${option}"`).join(" | ");
  return union.length <= 40 ? union : `one of ${options.length}`;
};

const typeLabel = (def: ExamplePropDef) => {
  switch (def.type) {
    case "select":
      return unionLabel(def.options);
    case "multiselect":
      return `(${unionLabel(def.options)})[]`;
    case "action":
      return "callback";
    default:
      return def.type;
  }
};

// short option lists are shown as a segmented control, others as a select
const isSegmented = ({ options }: SelectPropDef) =>
  options.length <= 4 && options.join("").length <= 24;

/** text and number inputs commit on Enter or blur, not on every keystroke */
const DraftInput = ({
  def,
  label,
  onCommit,
  value,
}: {
  def: NumberPropDef | { type: "string" };
  label: string;
  onCommit: (value: ExamplePropValue) => void;
  value: number | string | undefined;
}) => {
  const [draft, setDraft] = useState(String(value ?? ""));
  useEffect(() => setDraft(String(value ?? "")), [value]);
  const isNumber = def.type === "number";
  const commit = () => {
    if (isNumber) {
      const number = Number(draft);
      if (draft.trim() !== "" && Number.isFinite(number)) {
        const { max = Infinity, min = -Infinity } = def as NumberPropDef;
        const clamped = Math.min(max, Math.max(min, number));
        onCommit(clamped);
        setDraft(String(clamped));
      } else {
        setDraft(String(value ?? ""));
      }
    } else {
      onCommit(draft);
    }
  };
  return (
    <input
      aria-label={label}
      className={`${classBase}-input`}
      inputMode={isNumber ? "decimal" : undefined}
      max={isNumber ? (def as NumberPropDef).max : undefined}
      min={isNumber ? (def as NumberPropDef).min : undefined}
      onBlur={commit}
      onChange={(evt) => setDraft(evt.target.value)}
      onKeyDown={(evt) => {
        if (evt.key === "Enter") commit();
        if (evt.key === "Escape") setDraft(String(value ?? ""));
      }}
      step={isNumber ? (def as NumberPropDef).step : undefined}
      type={isNumber ? "number" : "text"}
      value={draft}
    />
  );
};

const PropControl = ({
  def,
  name,
  onChange,
  value,
}: {
  def: ExamplePropDef;
  name: string;
  onChange: (value: ExamplePropValue) => void;
  value: ExamplePropValue | undefined;
}) => {
  switch (def.type) {
    case "boolean":
      return (
        <button
          aria-checked={value === true}
          aria-label={name}
          className={`${classBase}-switch`}
          onClick={() => onChange(value !== true)}
          role="switch"
          type="button"
        />
      );
    case "number":
    case "string":
      return (
        <DraftInput
          def={def}
          label={name}
          onCommit={onChange}
          value={value as number | string | undefined}
        />
      );
    case "select":
      return isSegmented(def) ? (
        <div className="ShowcaseSegmented" role="group" aria-label={name}>
          {def.options.map((option) => (
            <button
              aria-pressed={value === option}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <ChromeSelect
          aria-label={name}
          onChange={onChange}
          options={[
            ...(value === undefined ? [{ label: "—", value: "" }] : []),
            ...def.options.map((option) => ({ label: option, value: option })),
          ]}
          value={(value as string | undefined) ?? ""}
        />
      );
    case "multiselect": {
      const selected = (value as string[] | undefined) ?? [];
      const toggle = (option: string) =>
        onChange(
          (def as MultiSelectPropDef).options.filter((o) =>
            o === option ? !selected.includes(o) : selected.includes(o),
          ),
        );
      return (
        <div className={`${classBase}-chips`} role="group" aria-label={name}>
          {def.options.map((option) => (
            <button
              aria-pressed={selected.includes(option)}
              className={`${classBase}-chip`}
              key={option}
              onClick={() => toggle(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
};

const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString(undefined, {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

export interface PropsPanelProps {
  componentName: string;
  /** undefined until the example has loaded and reported its props */
  defs?: ExamplePropDefs;
  log: ActionLogEntry[];
  onChange: (name: string, value: ExamplePropValue) => void;
  onClearLog: () => void;
  onReset: () => void;
  values: ExamplePropValues;
}

/**
 * Controls for the props an example declares, see example-props.ts. Values
 * are held in the url. Callback props are listed with a log of their calls.
 */
export const PropsPanel = ({
  componentName,
  defs,
  log,
  onChange,
  onClearLog,
  onReset,
  values,
}: PropsPanelProps) => {
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(defs ?? {});
  const props = entries.filter(([, def]) => def.type !== "action");
  const actions = entries.filter(([, def]) => def.type === "action");
  const changed = Object.keys(values).length > 0;

  const copyJsx = async () => {
    try {
      await navigator.clipboard.writeText(exampleToJsx(componentName, values));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <aside aria-label="Props" className={classBase}>
      <div className={`${classBase}-header`}>
        <ChromeIcon name="sliders" />
        <h2 className={`${classBase}-title`}>Props</h2>
        <button
          className={`${classBase}-link`}
          disabled={!changed}
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className={`${classBase}-body`}>
        {defs === undefined ? (
          <p className={`${classBase}-empty`}>Loading…</p>
        ) : null}
        {props.length > 0 ? (
          <ul className={`${classBase}-list`}>
            {props.map(([name, def]) => (
              <li
                className={`${classBase}-row`}
                data-changed={name in values || undefined}
                data-type={def.type}
                key={name}
              >
                <div className={`${classBase}-name`} title={def.description}>
                  <code>{name}</code>
                  <span className={`${classBase}-type`}>{typeLabel(def)}</span>
                  {def.description ? (
                    <span className={`${classBase}-description`}>
                      {def.description}
                    </span>
                  ) : null}
                </div>
                <div className={`${classBase}-control`}>
                  <PropControl
                    def={def}
                    name={name}
                    onChange={(value) => onChange(name, value)}
                    value={effectivePropValue(def, values[name])}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {actions.length > 0 ? (
          <section className={`${classBase}-actions`}>
            <div className={`${classBase}-sectionHeader`}>
              <h3>Actions</h3>
              <button
                className={`${classBase}-link`}
                disabled={log.length === 0}
                onClick={onClearLog}
                type="button"
              >
                Clear
              </button>
            </div>
            <p className={`${classBase}-actionNames`}>
              {actions.map(([name]) => (
                <code key={name}>{name}</code>
              ))}
            </p>
            {log.length === 0 ? (
              <p className={`${classBase}-empty`}>
                Interact with the example to see callbacks here.
              </p>
            ) : (
              <ol className={`${classBase}-log`} aria-live="polite">
                {log.map((entry) => (
                  <li key={entry.id}>
                    <time>{formatTime(entry.time)}</time>
                    <code>{entry.name}</code>
                    <span title={entry.args}>{entry.args}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </div>
      <div className={`${classBase}-footer`}>
        <button
          className="ShowcaseButton"
          disabled={defs === undefined}
          onClick={copyJsx}
          type="button"
        >
          <ChromeIcon name={copied ? "check" : "copy"} />
          {copied ? "Copied" : "Copy as JSX"}
        </button>
        <p className={`${classBase}-note`}>
          <ChromeIcon name="info" size={14} />
          Changes are held in the URL, so a configured example can be shared.
        </p>
      </div>
    </aside>
  );
};
