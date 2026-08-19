import { Text } from "@salt-ds/core";
import {
  LayersIcon,
  LinkedIcon,
  MenuIcon,
  VisibleIcon,
  WarningIcon,
} from "@salt-ds/icons";
import cx from "clsx";
import type { ReactNode } from "react";
import { type ModuleKpis as Kpis, plural } from "../data/module-model";

const classBase = "vuuModuleAdmin";

const Kpi = ({
  icon,
  label,
  onClick,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  tone?: "warning";
  value: ReactNode;
}) => {
  const content = (
    <>
      <span className={`${classBase}-kpiIcon`}>{icon}</span>
      <span className={`${classBase}-kpiText`}>
        <span className={`${classBase}-kpiValue`}>{value}</span>
        <Text color="secondary" styleAs="label">
          {label}
        </Text>
      </span>
    </>
  );
  const className = cx(`${classBase}-kpi`, tone && `${classBase}-kpi-${tone}`);
  return onClick ? (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
};

export const ModuleKpis = ({
  kpis,
  onShowIssues,
}: {
  kpis: Kpis;
  onShowIssues: () => void;
}) => (
  <section aria-label="Summary" className={`${classBase}-kpis`}>
    <Kpi
      icon={<LayersIcon aria-hidden />}
      label="Registered modules"
      value={kpis.total}
    />
    <Kpi
      icon={<VisibleIcon aria-hidden />}
      label="Enabled"
      value={
        <>
          {kpis.enabled}
          {kpis.disabled ? (
            <span className={`${classBase}-kpiAside`}>
              {" "}
              / {kpis.disabled} disabled
            </span>
          ) : null}
        </>
      }
    />
    <Kpi
      icon={<MenuIcon aria-hidden />}
      label="Menu sections"
      value={kpis.sections}
    />
    <Kpi
      icon={<LinkedIcon aria-hidden />}
      label="Dedicated Vuu connections"
      value={kpis.connections}
    />
    <Kpi
      icon={<WarningIcon aria-hidden />}
      label={
        kpis.issues
          ? `Issues on ${plural(kpis.modulesWithIssues, "module")}`
          : "No issues found"
      }
      onClick={kpis.issues ? onShowIssues : undefined}
      tone={kpis.issues ? "warning" : undefined}
      value={kpis.issues}
    />
  </section>
);
