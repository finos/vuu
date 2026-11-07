import { Button } from "@salt-ds/core";
import cx from "clsx";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ModuleDetail } from "../components/ModuleDetail";
import { ModuleList } from "../components/ModuleList";
import { EmptyMessage } from "../components/ui";
import { listModules, plural } from "../data/module-model";
import { useModuleAdmin } from "../ModuleAdminContext";

const classBase = "vuuModulesPage";

/**
 * The module list beside the selected module's config. Each pane scrolls on
 * its own. In a narrow workspace only one pane shows: the list, or the
 * module named in the route.
 */
export const ModulesPage = () => {
  const { counts, filter, paths, setFilter, setStatus, status, views } =
    useModuleAdmin();
  const { name } = useParams();
  const groups = useMemo(
    () => listModules(views, filter, status),
    [filter, status, views],
  );
  const listed = groups.flatMap(({ modules }) => modules);
  const selected = name
    ? views.find((module) => module.name === name)
    : listed[0];
  const filtered = filter.trim() !== "" || status !== "all";

  return (
    <div
      className={cx(classBase, { [`${classBase}-routed`]: name !== undefined })}
    >
      <div className={`${classBase}-list`}>
        <div className={`${classBase}-listScroll`}>
          {listed.length > 0 ? (
            <ModuleList groups={groups} selectedName={selected?.name} />
          ) : (
            <EmptyMessage
              action={
                filtered ? (
                  <Button
                    appearance="transparent"
                    onClick={() => {
                      setFilter("");
                      setStatus("all");
                    }}
                    sentiment="accented"
                  >
                    Clear filter
                  </Button>
                ) : undefined
              }
              title={
                filtered
                  ? filter.trim()
                    ? `No modules match "${filter.trim()}"`
                    : "No modules match this status"
                  : "No modules registered"
              }
            >
              {filtered
                ? "The filter matches title, name, scope, route, menu location and access role."
                : "Module discovery has not published any modules."}
            </EmptyMessage>
          )}
        </div>
        <footer className={`${classBase}-listFooter`}>
          {listed.length === counts.total
            ? `${plural(counts.total, "module")} · ${plural(counts.sections, "menu section")}`
            : `${listed.length} of ${plural(counts.total, "module")}`}
        </footer>
      </div>
      <div className={`${classBase}-detail`}>
        {selected ? (
          <ModuleDetail backTo={paths.modules} module={selected} />
        ) : name ? (
          <EmptyMessage title={`No module named "${name}"`}>
            It may have been removed from module discovery.
          </EmptyMessage>
        ) : (
          <EmptyMessage title="No module selected" />
        )}
      </div>
    </div>
  );
};
