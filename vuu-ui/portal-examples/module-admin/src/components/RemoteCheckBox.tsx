import { Button, Text } from "@salt-ds/core";
import { ErrorIcon, RefreshIcon, SuccessCircleIcon } from "@salt-ds/icons";
import { type ModuleView, relativeTime } from "../data/module-model";
import {
  CONFIG_FILE,
  MANIFEST_FILE,
  type RemoteCheckItem,
} from "../data/remote-check";

const classBase = "vuuModuleCheck";

const CheckItems = ({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: RemoteCheckItem[];
  title: string;
}) => (
  <section aria-label={title} className={classBase}>
    <Text className={`${classBase}-title`} styleAs="label">
      <code>{title}</code>
    </Text>
    {items.length > 0 ? (
      <ul className={`${classBase}-items`}>
        {items.map((item) => (
          <li key={item.label}>
            {item.ok ? (
              <SuccessCircleIcon
                aria-label="Passed"
                className={`${classBase}-ok`}
              />
            ) : (
              <ErrorIcon aria-label="Failed" className={`${classBase}-fail`} />
            )}
            <strong>{item.label}</strong>
            <code>{item.detail}</code>
          </li>
        ))}
      </ul>
    ) : (
      <Text color="secondary">{emptyText}</Text>
    )}
  </section>
);

export const RemoteCheckBox = ({
  module,
  onRecheck,
}: {
  module: ModuleView;
  onRecheck: () => void;
}) => {
  const check = module.remote;
  const checking = check?.status === "checking";
  const emptyText = checking
    ? "Checking remote…"
    : check?.status === "unreachable"
      ? "Not checked, the remote is unreachable."
      : "Remote not checked yet.";
  return (
    <div className={`${classBase}-group`}>
      <CheckItems
        emptyText={checking ? emptyText : "Remote not checked yet."}
        items={check?.items ?? []}
        title={MANIFEST_FILE}
      />
      <CheckItems
        emptyText={emptyText}
        items={check?.configItems ?? []}
        title={CONFIG_FILE}
      />
      <div className={`${classBase}-footer`}>
        <Text color="secondary" styleAs="label">
          {check?.checkedAt
            ? `Checked from this browser ${relativeTime(check.checkedAt)}`
            : "Checks run from this browser, not the server"}
        </Text>
        <Button
          appearance="transparent"
          disabled={checking || !module.mfUrl}
          onClick={onRecheck}
        >
          <RefreshIcon aria-hidden /> Re-check
        </Button>
      </div>
    </div>
  );
};
