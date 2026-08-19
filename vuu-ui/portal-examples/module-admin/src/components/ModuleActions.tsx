import { Button, Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { MicroMenuIcon } from "@salt-ds/icons";
import { createContext, useContext } from "react";
import type { ModuleView } from "../data/module-model";

export interface ModuleActions {
  select: (module: ModuleView) => void;
  edit: (module: ModuleView) => void;
  /** Enables a module, or asks to confirm disabling it. */
  toggleEnabled: (module: ModuleView) => void;
  duplicate: (module: ModuleView) => void;
  checkRemote: (module: ModuleView) => void;
  delete: (module: ModuleView) => void;
}

const noop = () => undefined;

export const ModuleActionsContext = createContext<ModuleActions>({
  checkRemote: noop,
  delete: noop,
  duplicate: noop,
  edit: noop,
  select: noop,
  toggleEnabled: noop,
});

export const useModuleActions = () => useContext(ModuleActionsContext);

export const ModuleActionsMenu = ({ module }: { module: ModuleView }) => {
  const actions = useModuleActions();
  // Menu events bubble through the portal to the card or row; keep them here.
  return (
    <span
      className="vuuModuleAdmin-actionsMenu"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Menu>
        <MenuTrigger>
          <Button
            appearance="transparent"
            aria-label={`More actions for ${module.title}`}
          >
            <MicroMenuIcon aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuPanel>
          <MenuItem onClick={() => actions.select(module)}>
            View details
          </MenuItem>
          <MenuItem onClick={() => actions.edit(module)}>Edit</MenuItem>
          <MenuItem onClick={() => actions.toggleEnabled(module)}>
            {module.enabled ? "Disable" : "Enable"}
          </MenuItem>
          <MenuItem onClick={() => actions.duplicate(module)}>
            Duplicate
          </MenuItem>
          <MenuItem
            disabled={!module.mfUrl}
            onClick={() => actions.checkRemote(module)}
          >
            Check remote
          </MenuItem>
          <MenuItem onClick={() => actions.delete(module)}>Delete…</MenuItem>
        </MenuPanel>
      </Menu>
    </span>
  );
};
