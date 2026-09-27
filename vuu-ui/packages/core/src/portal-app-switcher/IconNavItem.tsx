import { Icon } from "@vuu-ui/vuu-ui-controls";
import { Link } from "react-router-dom";
import type { NavItem } from "./PortalAppSwitcher";
import type { CSSProperties } from "react";
import cx from "clsx";
import { useNavContextMenu } from "./useNavContextMenu";

const classBase = "vuuIconNavItem";

export function IconNavItem({
  active,
  item,
}: {
  active: boolean;
  item: NavItem;
}) {
  const { href, navIconName = "custom", navIconUrl, title } = item;
  const onContextMenu = useNavContextMenu({ item, targetWindow: window });

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
      to={href}
    >
      <div className={`${classBase}-flyout`}>
        <Icon aria-label={title} name={navIconName} style={style} size={24} />
        <span className={`${classBase}-label`}>
          <span style={{ paddingRight: 12 }}>{title}</span>
        </span>
      </div>
    </Link>
  );
}
