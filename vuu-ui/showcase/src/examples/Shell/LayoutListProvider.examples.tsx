import {
  FeatureAndLayoutProvider,
  LayoutList,
  PersistenceProvider,
  StaticPersistenceManager,
  WorkspaceProvider,
} from "@vuu-ui/vuu-shell";
import { useMemo } from "react";
import { sysLayouts } from "../_test-data/sysLayoutMetadata";

export const LayoutListProvider = () => {
  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        // prettier-ignore
        layoutMetadata: [
        {id: "layout-01", group: "Group 1", name: "Layout 1", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-02", group: "Group 1", name: "Layout 2", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-07", group: "Group 2", name: "Layout 7", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-08", group: "Group 2", name: "Layout 8", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-12", group: "Group 3", name: "Layout 12", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-13", group: "Group 3", name: "Layout 13", created: "26.05.2024", screenshot: "", user: "steve" },
       {id: "layout-17", group: "Group 4", name: "Layout 17", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-18", group: "Group 4", name: "Layout 18", created: "26.05.2024", screenshot: "", user: "steve" },
      ],
      }),
    [],
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <FeatureAndLayoutProvider systemLayouts={sysLayouts}>
        <WorkspaceProvider>
          <LayoutList style={{ width: 300 }} />
        </WorkspaceProvider>
      </FeatureAndLayoutProvider>
    </PersistenceProvider>
  );
};
