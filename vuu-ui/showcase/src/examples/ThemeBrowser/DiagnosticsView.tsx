import type {
  DiagnosticType,
  ThemeDiagnostic,
} from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { useMemo, useState } from "react";
import { DIAGNOSTIC_INFO } from "./model-utils";
import { TokenPreview } from "./TokenPreview";
import { useThemeBrowser } from "./ThemeBrowserContext";

interface MissingFamily {
  family: string;
  names: Set<string>;
  refs: ThemeDiagnostic[];
}

const formatLocation = (d: ThemeDiagnostic) =>
  d.location ? `${d.location.file}:${d.location.line}` : "—";

const UnresolvedTable = ({
  diagnostics,
}: {
  diagnostics: ThemeDiagnostic[];
}) => {
  const { index, resolve, select } = useThemeBrowser();
  const families = useMemo(() => {
    const families = new Map<string, MissingFamily>();
    for (const d of diagnostics) {
      const name = /references (--[\w-]+)/.exec(d.message)?.[1];
      if (!name) continue;
      // group e.g --salt-color-cobalt-100..900 as --salt-color-cobalt-*
      const family = name.replace(/-\d+$/, "-*");
      const entry = families.get(family) ?? {
        family,
        names: new Set(),
        refs: [],
      };
      entry.names.add(name);
      entry.refs.push(d);
      families.set(family, entry);
    }
    return [...families.values()];
  }, [diagnostics]);

  const undeclared = families.reduce((n, f) => n + f.names.size, 0);

  return (
    <section className="diag-list">
      <div className="f-head">
        <h3>Unresolved references</h3>
        <span className="muted">
          {diagnostics.length} references to {undeclared} undeclared tokens,
          grouped by token family
        </span>
      </div>
      <table className="diag-table">
        <thead>
          <tr>
            <th>Missing token family</th>
            <th>Referenced by</th>
            <th>Example source</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          {families.map(({ family, refs }) => {
            const referrers = [...new Set(refs.flatMap((r) => r.token ?? []))];
            const referrer = index.token(referrers[0]);
            return (
              <tr key={family}>
                <td>
                  <span className="chip warn">missing</span>
                  <span className="mono">{family}</span>
                </td>
                <td>
                  {referrer ? (
                    <button
                      className="link mono"
                      onClick={() => select(referrer.name, "tiers")}
                      title={referrers.join("\n")}
                    >
                      {referrer.name}
                      {referrers.length > 1 ? ` +${referrers.length - 1}` : ""}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="mono muted">{formatLocation(refs[0])}</td>
                <td>
                  {referrer ? (
                    <span className="effect">
                      <TokenPreview token={referrer} size="xs" />
                      {resolve(referrer.name)
                        ? "resolves"
                        : "invalid at computed-value time"}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

const DiagnosticTable = ({
  diagnostics,
  type,
}: {
  diagnostics: ThemeDiagnostic[];
  type: DiagnosticType;
}) => {
  const { index, select } = useThemeBrowser();
  return (
    <section className="diag-list">
      <div className="f-head">
        <h3>{DIAGNOSTIC_INFO[type].label}</h3>
        <span className="muted">{DIAGNOSTIC_INFO[type].blurb}</span>
      </div>
      <table className="diag-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Token</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {diagnostics.map((d, i) => (
            <tr key={i}>
              <td>{d.message}</td>
              <td>
                {d.token && index.token(d.token) ? (
                  <button
                    className="link mono"
                    onClick={() => select(d.token!, "tiers")}
                  >
                    {d.token}
                  </button>
                ) : (
                  <span className="mono">{d.token ?? "—"}</span>
                )}
              </td>
              <td className="mono muted">{formatLocation(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export const DiagnosticsView = () => {
  const { model } = useThemeBrowser();
  const byType = useMemo(() => {
    const byType = new Map<DiagnosticType, ThemeDiagnostic[]>(
      (Object.keys(DIAGNOSTIC_INFO) as DiagnosticType[]).map((k) => [k, []]),
    );
    for (const d of model.diagnostics) byType.get(d.type)?.push(d);
    return byType;
  }, [model]);

  const firstWithIssues =
    [...byType.entries()].find(([, list]) => list.length)?.[0] ??
    "unresolved-reference";
  const [type, setType] = useState<DiagnosticType>(firstWithIssues);
  const diagnostics = byType.get(type) ?? [];

  return (
    <main className="diag-view">
      <div className="diag-summary">
        {[...byType.entries()].map(([t, list]) => (
          <button
            className={cx("diag-card", {
              has: list.length,
              selected: t === type,
            })}
            key={t}
            onClick={() => setType(t)}
          >
            <div className="diag-count">{list.length}</div>
            <div className="diag-label">{DIAGNOSTIC_INFO[t].label}</div>
            <div className="muted">{DIAGNOSTIC_INFO[t].blurb}</div>
          </button>
        ))}
      </div>
      {diagnostics.length === 0 ? (
        <section className="diag-list">
          <div className="empty">
            No {DIAGNOSTIC_INFO[type].label.toLowerCase()}
          </div>
        </section>
      ) : type === "unresolved-reference" ? (
        <UnresolvedTable diagnostics={diagnostics} />
      ) : (
        <DiagnosticTable diagnostics={diagnostics} type={type} />
      )}
    </main>
  );
};
