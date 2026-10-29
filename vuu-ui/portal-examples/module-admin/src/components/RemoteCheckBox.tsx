import { Button } from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { type ModuleView, relativeTime } from "../data/module-model";
import type { RemoteCheckItem } from "../data/remote-check";

const classBase = "vuuModuleCheck";

const CheckItem = ({ item }: { item: RemoteCheckItem }) => (
  <li
    className={cx(`${classBase}-item`, {
      [`${classBase}-item-failed`]: !item.ok,
    })}
  >
    <Icon
      aria-label={item.ok ? "Passed" : "Failed"}
      name={item.ok ? "tick" : "cross-circle"}
    />
    <span className={`${classBase}-label`}>{item.label}</span>
    <code>{item.detail}</code>
  </li>
);

/**
 * The result of checking the module's remote against its manifest, from this
 * browser.
 */
export const RemoteCheckBox = ({
  module,
  onRecheck,
}: {
  module: ModuleView;
  onRecheck: () => void;
}) => {
  const check = module.remote;
  const checking = check?.status === "checking";
  const items = check?.items ?? [];
  return (
    <div className={classBase}>
      {items.length > 0 ? (
        <ul aria-label="Remote check" className={`${classBase}-items`}>
          {items.map((item) => (
            <CheckItem item={item} key={item.label} />
          ))}
        </ul>
      ) : null}
      <div className={`${classBase}-footer`}>
        <span>
          {checking
            ? "Checking remote…"
            : check?.checkedAt
              ? `Checked from this browser ${relativeTime(check.checkedAt)}`
              : "Checks run from this browser, not the server"}
        </span>
        <Button
          appearance="transparent"
          aria-label="Check remote again"
          disabled={checking || !module.mfUrl}
          onClick={onRecheck}
          title="Check remote again"
        >
          <Icon name="module-refresh" />
        </Button>
      </div>
    </div>
  );
};
