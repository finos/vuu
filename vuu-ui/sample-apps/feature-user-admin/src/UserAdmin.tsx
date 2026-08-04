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

      <div className="vuuUserAdmin-tableContainer">
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


    </div >
  );
};

export default UserAdmin;
