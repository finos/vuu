import {
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Text,
} from "@salt-ds/core";
import { EditField } from "@vuu-ui/vuu-data-editing";
import {
  TableEditorButtons,
  TableEditorModeToggle,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import { ModulePicker } from "../module-picker/ModulePicker";
import { useUserEditForm } from "./useUserEditForm";

import "./UserEditForm.css";

const classBase = "vuuUserEditForm";

/**
 * The content of the user form, rendered within a `TableEditorForm`. Fields
 * edit the selected row; module permissions are committed to the same edit
 * session, so they are saved, or discarded, along with them.
 */
export const UserEditForm = () => {
  const { dataSource, isEditing, selectedRow } = useTableEditor();
  if (selectedRow === undefined) {
    throw Error("UserEditForm must be rendered within a TableEditorForm");
  }
  const { allModules, modulePermissions, onSelectedModulesChange } =
    useUserEditForm(selectedRow, dataSource);

  return (
    <>
      <div className="vuuIdentityAdmin-mode">
        <Text color="secondary" styleAs="label">
          {isEditing
            ? "Editing. Save or cancel your changes."
            : "Switch to Edit to change this user."}
        </Text>
        <TableEditorModeToggle />
      </div>

      <div className={classBase}>
        <Tabs defaultValue="UserDetails">
          <TabBar divider>
            <TabList>
              <Tab value="UserDetails">
                <TabTrigger>Profile</TabTrigger>
              </Tab>
              <Tab value="Permissions">
                <TabTrigger>Application access</TabTrigger>
              </Tab>
            </TabList>
          </TabBar>
          <TabPanel value="UserDetails">
            <EditField label="Username" name="username" readOnly required />
            <EditField label="Email" name="email" required type="email" />
            <EditField label="First name" name="first_name" />
            <EditField label="Last name" name="last_name" />
            <EditField label="Enabled" name="enabled" type="checkbox" />
            <EditField
              label="Temporary password"
              name="temporary_password"
              type="password"
            />
          </TabPanel>
          <TabPanel value="Permissions">
            <ModulePicker
              allModules={allModules}
              aria-label="Portal modules"
              itemTypeName="remote module"
              modulePermissions={modulePermissions}
              onSelectedModulesChange={onSelectedModulesChange}
              permissionMultiselect
              readOnly={!isEditing}
              searchForm={false}
            />
          </TabPanel>
        </Tabs>
      </div>
      <div className="vuuIdentityAdmin-panelFooter">
        <TableEditorButtons />
      </div>
    </>
  );
};
