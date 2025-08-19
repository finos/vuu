import { FilterPill, FilterPillNext } from "@vuu-ui/vuu-filters";
import { PopupMenuProps } from "@vuu-ui/vuu-popups";
import { ExitEditModeHandler, Icon } from "@vuu-ui/vuu-ui-controls";
import { Button, Input } from "@salt-ds/core";
import { useCallback, useMemo, useState } from "react";
import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";

export const DefaultFilterPill = () => {
  const [active, setActive] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  return (
    <FilterPill
      selected={active}
      data-showcase-center
      filter={{
        column: "currency",
        op: "=",
        value: "EUR",
      }}
      onClick={handleClick}
    />
  );
};

export const DefaultFilterPillNext = () => {
  const [active, setActive] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  return (
    <FilterPillNext
      active={active}
      data-showcase-center
      filter={{
        column: "currency",
        name: "EUROS",
        op: "=",
        value: "EUR",
      }}
      id="test-filter"
      onClick={handleClick}
      onMenuAction={(actionType) => console.log(`action ${actionType}`)}
    />
  );
};

export const FilterPillNotEditable = () => {
  const [active, setActive] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  return (
    <FilterPill
      allowRename={false}
      selected={active}
      data-showcase-center
      filter={{
        column: "currency",
        op: "=",
        value: "EUR",
      }}
      onClick={handleClick}
    />
  );
};

const menuBuilder: MenuBuilder = (_, options) => [
  { id: "and-clause", label: "AND", options },
  { id: "or-clause", label: "OR", options },
];

const defaultMenuHandler: MenuActionHandler = (menuId) => {
  console.log(`Menu Action ${menuId} invoked`);
  if (menuId === "action-1" || menuId === "action-1") {
    // invoke our action here
    return true;
  }
};

export const FilterPillWithMenu = () => {
  const [active, setActive] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  const handleMenuAction = useCallback<MenuActionHandler>((menuId) => {
    console.log(`menuId ${menuId}`);
    return true;
  }, []);

  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler: defaultMenuHandler,
  };

  return (
    <FilterPill
      PopupMenuProps={menuProps}
      data-showcase-center
      filter={{
        column: "currency",
        op: "=",
        value: "EUR",
      }}
      onClick={handleClick}
      onMenuAction={handleMenuAction}
      selected={active}
    />
  );
};

export const FilterPillEditableLabel = () => {
  const [active, setActive] = useState(false);
  const [editing, setEditing] = useState(false);
  const handleClick = useMemo(() => () => setActive((value) => !value), []);

  const handleMenuAction = useCallback<MenuActionHandler>((menuId) => {
    if (menuId === "rename-filter") {
      setTimeout(() => {
        setEditing(true);
      }, 300);
    }
    return true;
  }, []);

  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler: defaultMenuHandler,
  };

  const handleExitEditMode = useCallback<ExitEditModeHandler>(
    (originalValue, newValue) => {
      console.log(`${originalValue} -> ${newValue}`);
      setEditing(false);
    },
    [],
  );

  const beginEdit = () => {
    requestAnimationFrame(() => {
      setEditing(true);
    });
  };

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Input style={{ width: 100 }} data-testid="pre-filterpill" />
      <FilterPill
        editing={editing}
        PopupMenuProps={menuProps}
        data-showcase-center
        filter={{
          column: "currency",
          op: "=",
          value: "EUR",
        }}
        onClick={handleClick}
        onExitEditMode={handleExitEditMode}
        onMenuAction={handleMenuAction}
        selected={active}
      />
      <Button className="vuuIconButton" disabled={editing} onClick={beginEdit}>
        <Icon name="edit" />
      </Button>
    </div>
  );
};

export const FilterPillVariations = () => {
  return (
    <div>
      <FilterPill
        data-showcase-center
        filter={{
          column: "currency",
          op: "=",
          value: "EUR",
        }}
        selected={true}
      />
      <FilterPill
        data-showcase-center
        filter={{
          column: "currency",
          op: "=",
          value: "EUR",
        }}
        selected={false}
      />
    </div>
  );
};
