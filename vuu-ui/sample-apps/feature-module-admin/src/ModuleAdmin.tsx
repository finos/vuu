import { Table } from "@vuu-ui/vuu-table";
import "./ModuleAdmin.css";
import { useModuleAdmin } from "./useModuleAdmin";

const ModuleAdmin = () => {
  const moduleAdmin = useModuleAdmin();

  if (moduleAdmin.status === "loading") {
    return (
      <div className="vuuModuleAdmin-state" role="status">
        Loading modules...
      </div>
    );
  }

  if (moduleAdmin.status === "error") {
    return (
      <div className="vuuModuleAdmin-state vuuModuleAdmin-error" role="alert">
        Unable to load modules: {moduleAdmin.error.message}
      </div>
    );
  }

  return (
    <div className="vuuModuleAdmin">
      <Table
        config={moduleAdmin.config}
        dataSource={moduleAdmin.dataSource}
        height="100%"
        navigationStyle="row"
        renderBufferSize={20}
        rowHeight={21}
        width="100%"
      />
    </div>
  );
};

export default ModuleAdmin;
