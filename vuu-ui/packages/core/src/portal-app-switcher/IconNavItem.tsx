import { Icon } from "@vuu-ui/vuu-ui-controls";
import { Link } from "react-router-dom";
import type { NavItem } from "./PortalAppSwitcher";
import type { CSSProperties, KeyboardEvent } from "react";
import cx from "clsx";
import { useNavContextMenu } from "./useNavContextMenu";
import { useNavItemPresence } from "./useNavItemPresence";

const classBase = "vuuIconNavItem";

export function IconNavItem({
  active,
  item,
  showPresence = true,
}: {
  active: boolean;
  item: NavItem;
  showPresence?: boolean;
}) {
  const { href, navIconName = "custom", navIconUrl, title } = item;
  const { anchorProps, className, elements, statusBadge, unavailable } =
    useNavItemPresence({ enabled: showPresence, item });
  const { onContextMenu, onKeyDown } = useNavContextMenu({
    item,
    targetWindow: window,
    unavailable,
  });

  const style = navIconUrl
    ? ({
        "--vuu-icon-svg": `url('${navIconUrl}')`,
      } as CSSProperties)
    : undefined;
  return (
    <>
      <Link
        {...anchorProps}
        aria-label={title}
        className={cx(classBase, className, {
          [`${classBase}-active`]: active,
        })}
        onContextMenu={onContextMenu}
        onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
          anchorProps.onKeyDown(event);
          onKeyDown?.(event);
        }}
        to={href}
      >
        <div className={`${classBase}-flyout`}>
          <span className="vuuNavItem-icon">
            <Icon
              aria-label={title}
              name={navIconName}
              style={style}
              size={24}
            />
            {statusBadge}
          </span>
          <span className={`${classBase}-label`}>
            <span style={{ paddingRight: 12 }}>{title}</span>
          </span>
        </div>
      </Link>
      {elements}
    </>
  );
}
