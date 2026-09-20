import {
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
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
  const { editSession, onCancel: cancelEdit, onSave } = useEditable({
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
      <ToggleButtonGroup
        onChange={onToggleEditMode}
        value={isEditMode ? "edit" : "view"}
      >
        <ToggleButton value="view">View</ToggleButton>
        <ToggleButton value="edit">Edit</ToggleButton>
      </ToggleButtonGroup>

      <form className={classBase}>
        <Tabs defaultValue="UserDetails">
          <TabBar inset divider>
            <TabList appearance="bordered">
              <Tab value="UserDetails">
                <TabTrigger>UserDetails</TabTrigger>
              </Tab>
              <Tab value="Permissions">
                <TabTrigger>Permissions</TabTrigger>
              </Tab>
            </TabList>
          </TabBar>
          <TabPanel value="UserDetails">
            <EditField
              dataRow={dataRow}
              label="UserName"
              name="username"
              required
            />
            <EditField
              dataRow={dataRow}
              label="Email"
              name="email"
              required
              type="email"
            />
            <EditField dataRow={dataRow} label="First Name" name="first_name" />
            <EditField dataRow={dataRow} label="Last Name" name="last_name" />
            <EditField
              dataRow={dataRow}
              label="Enabled"
              name="enabled"
              type="checkbox"
            />
            <EditField
              dataRow={dataRow}
              label="Temporary Password"
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
              permissionMultiselect={false}
              searchForm={false}
            />
          </TabPanel>
        </Tabs>
        <div className="vuuIdentityAdmin-formActions" />
      </form>
      <EditButtons
        canCancel={editSession.canCancel}
        canSave={editSession.canSave}
        editSession={editSession}
        onCancel={onCancel}
        onSave={onSave}
      />
    </DataEditingProvider>
  );
};
