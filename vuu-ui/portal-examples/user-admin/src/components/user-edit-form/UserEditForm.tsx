import {
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import {
  DataEditingProvider,
  EditButtons,
  EditField,
  useEditable,
  useEditMode,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useCallback } from "react";
import { ModulePicker } from "../module-picker/ModulePicker";
import { useUserEditForm } from "./useUserEditForm";

import "./UserEditForm.css";

const classBase = "vuuUserEditForm";

export interface UserEditFormProps {
  dataRow: DataRow;
  dataSource: DataSource;
}

export const UserEditForm = ({ dataRow, dataSource }: UserEditFormProps) => {
  const { isEditMode, setEditMode } = useEditMode();
  const exitEditMode = useCallback(() => setEditMode(false), [setEditMode]);
  const {
    editSession,
    onCancel: cancelEdit,
    onSave,
  } = useEditable({
    dataSource,
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });
  const {
    allModules,
    modulePermissions,
    onSelectedModulesChange,
    resetModulePermissions,
  } = useUserEditForm(dataRow, dataSource, editSession);
  const onCancel = useCallback(() => {
    resetModulePermissions();
    cancelEdit();
  }, [cancelEdit, resetModulePermissions]);

  const onToggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  return (
    <DataEditingProvider editSession={editSession}>
      <div className="vuuIdentityAdmin-mode">
        <Text color="secondary" styleAs="label">
          {isEditMode
            ? "Editing. Save or cancel your changes."
            : "Switch to Edit to change this user."}
        </Text>
        <ToggleButtonGroup
          aria-label="Mode"
          onChange={onToggleEditMode}
          value={isEditMode ? "edit" : "view"}
        >
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <form className={classBase}>
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
            <EditField
              dataRow={dataRow}
              label="Username"
              name="username"
              readOnly
              required
            />
            <EditField
              dataRow={dataRow}
              label="Email"
              name="email"
              required
              type="email"
            />
            <EditField dataRow={dataRow} label="First name" name="first_name" />
            <EditField dataRow={dataRow} label="Last name" name="last_name" />
            <EditField
              dataRow={dataRow}
              label="Enabled"
              name="enabled"
              type="checkbox"
            />
            <EditField
              dataRow={dataRow}
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
              readOnly={!isEditMode}
              searchForm={false}
            />
          </TabPanel>
        </Tabs>
      </form>
      <div className="vuuIdentityAdmin-panelFooter">
        <EditButtons
          canCancel={editSession.canCancel}
          canSave={editSession.canSave}
          editSession={editSession}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    </DataEditingProvider>
  );
};
