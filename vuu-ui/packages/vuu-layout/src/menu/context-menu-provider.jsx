import React, { useCallback, useContext, useMemo } from 'react';
import { PopupService } from '../popup';
import ContextMenu from './ContextMenu';
import { MenuItem, MenuItemGroup } from './MenuList';

const showContextMenu = (e, menuDescriptors, handleContextMenuAction) => {
  const { clientX: left, clientY: top } = e;
  const menuItems = (menuDescriptors) => {
    const fromDescriptor = ({ children, label, icon, action, options }, i) =>
      children ? (
        <MenuItemGroup key={i} label={label}>
          {children.map(fromDescriptor)}
        </MenuItemGroup>
      ) : (
        <MenuItem key={i} action={action} data-icon={icon} options={options}>
          {label}
        </MenuItem>
      );

    return menuDescriptors.map(fromDescriptor);
  };

  const handleClose = (menuId, options) => {
    if (menuId) {
      handleContextMenuAction(menuId, options);
      PopupService.hidePopup();
    }
  };

  const component = (
    <ContextMenu onClose={handleClose} position={{ x: left, y: top }}>
      {menuItems(menuDescriptors)}
    </ContextMenu>
  );
  PopupService.showPopup({ left: 0, top: 0, component });
};

export const ContextMenuContext = React.createContext(null);

const NO_INHERITED_CONTEXT = {
  menuItemDescriptors: []
};

// The menuBuilder will always be supplied by the code that will display the local
// context menu. It will be passed all configured menu descriptors. It is free to
// augment, replace or ignore the existing menu descriptors.
export const useContextMenu = () => {
  const { menuActionHandler, menuBuilders } = useContext(ContextMenuContext);

  const buildMenuOptions = useCallback((menuBuilders, location, options) => {
    let results = [];
    for (const menuBuilder of menuBuilders) {
      // Maybe we should leave the concatenation to the menuBuilder, then it can control menuItem order
      results = results.concat(menuBuilder(location, options));
    }
    return results;
  }, []);

  const handleShowContextMenu = (e, location, options) => {
    e.stopPropagation();
    e.preventDefault();
    const menuItemDescriptors = buildMenuOptions(menuBuilders, location, options);
    if (menuItemDescriptors.length) {
      showContextMenu(e, menuItemDescriptors, menuActionHandler);
    }
  };

  return handleShowContextMenu;
};

const Provider = ({
  children,
  context: { menuBuilders: inheritedMenuBuilders, menuActionHandler: inheritedMenuActionHandler },
  menuActionHandler,
  menuBuilder
}) => {
  const menuBuilders = useMemo(() => {
    if (inheritedMenuBuilders && menuBuilder) {
      return inheritedMenuBuilders.concat(menuBuilder);
    } else if (menuBuilder) {
      return [menuBuilder];
    } else {
      return inheritedMenuBuilders || [];
    }
  }, [inheritedMenuBuilders, menuBuilder]);

  const handleMenuAction = useCallback(
    (type, options) => {
      if (menuActionHandler && menuActionHandler(type, options)) {
        return true;
      }

      if (inheritedMenuActionHandler && inheritedMenuActionHandler(type, options)) {
        return true;
      }
    },
    [inheritedMenuActionHandler, menuActionHandler]
  );

  return (
    <ContextMenuContext.Provider
      value={{
        menuActionHandler: handleMenuAction,
        menuBuilders
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

// Need an option for local menu to override higher-level menu, rather than extend
export const ContextMenuProvider = ({
  children,
  menuActionHandler,
  menuBuilder,
  menuItemDescriptors,
  label
}) => {
  return (
    <ContextMenuContext.Consumer>
      {(parentContext) => (
        <Provider
          context={parentContext || NO_INHERITED_CONTEXT}
          label={label}
          menuActionHandler={menuActionHandler}
          menuBuilder={menuBuilder}
          menuItemDescriptors={menuItemDescriptors}
        >
          {children}
        </Provider>
      )}
    </ContextMenuContext.Consumer>
  );
};
