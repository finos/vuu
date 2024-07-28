import {
  LayoutList,
  WorkspaceProvider,
  PersistenceProvider,
  StaticPersistenceManager,
} from "@finos/vuu-shell";
import layoutMetadata from "../_test-data/layoutMetadata";
import { useMemo } from "react";

let displaySequence = 0;

export const DefaultLayoutList = (): JSX.Element => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({ layoutMetadata }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <WorkspaceProvider>
        <LayoutList style={{ width: 300 }} />
      </WorkspaceProvider>
    </PersistenceProvider>
  );
};
DefaultLayoutList.displaySequence = displaySequence++;

export const LayoutListManyLayouts = (): JSX.Element => {
  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        // prettier-ignore
        layoutMetadata: [
        {id: "layout-01", group: "Group 1", name: "Layout 1", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-02", group: "Group 1", name: "Layout 2", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-03", group: "Group 1", name: "Layout 3", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-04", group: "Group 1", name: "Layout 4", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-05", group: "Group 1", name: "Layout 5", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-06", group: "Group 1", name: "Layout 6", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-07", group: "Group 2", name: "Layout 7", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-08", group: "Group 2", name: "Layout 8", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-09", group: "Group 2", name: "Layout 9", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-10", group: "Group 2", name: "Layout 10", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-11", group: "Group 2", name: "Layout 11", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-12", group: "Group 3", name: "Layout 12", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-13", group: "Group 3", name: "Layout 13", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-14", group: "Group 3", name: "Layout 14", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-15", group: "Group 4", name: "Layout 15", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-16", group: "Group 4", name: "Layout 16", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-17", group: "Group 4", name: "Layout 17", created: "26.05.2024", screenshot: "", user: "steve" },
        {id: "layout-18", group: "Group 4", name: "Layout 18", created: "26.05.2024", screenshot: "", user: "steve" },
      ],
      }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <WorkspaceProvider>
        <LayoutList style={{ width: 300 }} />
      </WorkspaceProvider>
    </PersistenceProvider>
  );
};
LayoutListManyLayouts.displaySequence = displaySequence++;
