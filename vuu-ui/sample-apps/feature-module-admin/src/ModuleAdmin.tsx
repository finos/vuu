import { ToggleButton, ToggleButtonGroup, Toolbar, ToolbarContent, Tooltray } from "@salt-ds/core";
import { DataEditingProvider, EditButtons } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { useModuleAdmin } from "./useModuleAdmin";

import "./ModuleAdmin.css";

const classBase = 'vuuModuleAdmin';

const ModuleAdmin = () => {
  const { canSave, editMode, editSession, onCancel, onSave, onToggleEditMode, config, dataSource, ...moduleAdmin } = useModuleAdmin();

  // if (moduleAdmin.status === "loading") {
  //   return (
  //     <div className="vuuModuleAdmin-state" role="status">
  //       Loading modules...
  //     </div>
  //   );
  // }

  // if (moduleAdmin.status === "error") {
  //   return (
  //     <div className="vuuModuleAdmin-state vuuModuleAdmin-error" role="alert">
  //       Unable to load modules: {moduleAdmin.error?.message}
  //     </div>
  //   );
  // }

  return (
    <div className={classBase}>
      <Toolbar variant="tertiary">
        <ToolbarContent position="start">
          <Tooltray align="start">
            <ToolbarContent position="end">
              <Tooltray align="end">
                <ToggleButtonGroup onChange={onToggleEditMode} value={editMode}>
                  <ToggleButton value="view">
                    View
                  </ToggleButton>
                  <ToggleButton value="edit">
                    Edit
                  </ToggleButton>
                </ToggleButtonGroup>
              </Tooltray>
            </ToolbarContent>

          </Tooltray>
        </ToolbarContent>

      </Toolbar>
      <div className={`${classBase}-tableContainer`}>
        <DataEditingProvider editSession={editSession}>
          < Table
            config={config}
            dataSource={dataSource}
            height="100%"
            navigationStyle="row"
            renderBufferSize={20}
            rowHeight={21}
            width="100%"
          />
        </DataEditingProvider>
      </div >
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={dataSource} />
        ) : (
          <EditButtons
            canSave={canSave}
            editSession={editSession}
            onCancel={onCancel}
            onSave={onSave}
          />
        )}
      </TableFooter>

    </div >
  );
};

export default ModuleAdmin;
