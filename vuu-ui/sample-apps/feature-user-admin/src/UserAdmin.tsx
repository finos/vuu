import { DockLayout, Drawer } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import { useUserAdmin } from "./useUserAdmin";
import "./UserAdmin.css";

const UserAdmin = () => {
  const hookResult = useUserAdmin();

  if (!hookResult) {
    return <div className="vuuUserAdmin-loading">Loading keycloak admin tables...</div>;
  }

  const { dataSources, drawerOpen, groupsConfig, handleUserSelectionChange, rolesConfig, usersConfig } = hookResult;

  return (
    <div className="vuuUserAdmin">

      <DockLayout className="vuuUserAdmin-layout">
        <Drawer
          inline
          open={drawerOpen}
          position="right"
          title="Groups and Roles"
          defaultOpen={false}
          sizeOpen={560}
        >
          <div className="vuuUserAdmin-drawerContent">
            <section className="vuuUserAdmin-drawerSection">
              <h2>Groups</h2>
              <div className="vuuUserAdmin-tableContainer">
                <Table
                  config={groupsConfig}
                  dataSource={dataSources.groups}
                  height="100%"
                  navigationStyle="row"
                  renderBufferSize={20}
                  rowHeight={21}
                  width="100%"
                />
              </div>
            </section>
            <section className="vuuUserAdmin-drawerSection">
              <h2>Available Roles</h2>
              <div className="vuuUserAdmin-tableContainer">
                <Table
                  config={rolesConfig}
                  dataSource={dataSources.roles}
                  height="100%"
                  navigationStyle="row"
                  renderBufferSize={20}
                  rowHeight={21}
                  width="100%"
                />
              </div>
            </section>
          </div>
        </Drawer>

        <div className="vuuUserAdmin-main">
          <Table
            config={usersConfig}
            dataSource={dataSources.users}
            height="100%"
            navigationStyle="row"
            onSelectionChange={handleUserSelectionChange}
            renderBufferSize={20}
            rowHeight={21}
            width="100%"
          />
        </div>
      </DockLayout>
    </div>
  );
};

export default UserAdmin;
