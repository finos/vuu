import { Button, Text } from "@salt-ds/core";
import { ErrorIcon, RefreshIcon, SuccessCircleIcon } from "@salt-ds/icons";
import cx from "clsx";
import { type ModuleView, relativeTime } from "../data/module-model";

const classBase = "vuuModuleCheck";

export const RemoteCheckBox = ({
  module,
  onRecheck,
}: {
  module: ModuleView;
  onRecheck: () => void;
}) => {
  const check = module.remote;
  return (
    <div className={cx(classBase, check && `${classBase}-${check.status}`)}>
      {check && check.status !== "checking" ? (
        <ul className={`${classBase}-items`}>
          {check.items.map((item) => (
            <li key={item.label}>
              {item.ok ? (
                <SuccessCircleIcon
                  aria-label="Passed"
                  className={`${classBase}-ok`}
                />
              ) : (
                <ErrorIcon
                  aria-label="Failed"
                  className={`${classBase}-fail`}
                />
              )}
              <strong>{item.label}</strong>
              <code>{item.detail}</code>
            </li>
          ))}
        </ul>
      ) : (
        <Text color="secondary">
          {check?.status === "checking"
            ? "Checking remote…"
            : "Remote not checked yet."}
        </Text>
      )}
      <div className={`${classBase}-footer`}>
        <Text color="secondary" styleAs="label">
          {check?.checkedAt
            ? `Checked from this browser ${relativeTime(check.checkedAt)}`
            : "Checks run from this browser, not the server"}
        </Text>
        <Button
          appearance="transparent"
          disabled={check?.status === "checking" || !module.mfUrl}
          onClick={onRecheck}
        >
          <RefreshIcon aria-hidden /> Re-check
        </Button>
      </div>
    </div>
  );
};
