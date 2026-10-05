import { Spinner } from "@salt-ds/core";
import { MenuTreeView } from "../components/MenuTreeView";
import { PageHeader } from "../components/PageHeader";
import { useModuleAdmin } from "../ModuleAdminContext";

const classBase = "vuuModuleAdmin";

export const MenuPage = () => {
  const { loading, views } = useModuleAdmin();
  return (
    <div className={`${classBase}-page`}>
      <PageHeader
        description="How registered modules are arranged in the portal menu."
        title="Menu structure"
      />
      {loading ? (
        <div className={`${classBase}-loading`}>
          <Spinner aria-label="Loading modules" />
        </div>
      ) : (
        <MenuTreeView modules={views} />
      )}
    </div>
  );
};
