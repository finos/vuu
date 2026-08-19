import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { NavItem } from "./PortalAppSwitcher";
import { useNavContextMenu } from "./useNavContextMenu";

const classBase = "vuuDashboardNavItem";

export function DashboardNavItem({
  active,
  item,
}: {
  active: boolean;
  item: NavItem;
}) {
  const { href, navIconName = "custom", navIconUrl, title } = item;
  const { onContextMenu, onKeyDown } = useNavContextMenu({
    item,
    targetWindow: window,
  });

  const style = navIconUrl
    ? ({
        "--vuu-icon-svg": `url('${navIconUrl}')`,
      } as CSSProperties)
    : undefined;
  return (
    <Link
      aria-label={title}
      className={cx(classBase, {
        [`${classBase}-active`]: active,
      })}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      to={href}
    >
      <Icon aria-label={title} name={navIconName} style={style} />
      <span className={`${classBase}-label`}>
        <span>{title}</span>
      </span>
    </Link>
  );
}
