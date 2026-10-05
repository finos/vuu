import { Spinner } from "@salt-ds/core";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreateModulePage,
  NEW_MODULE_CONFIG,
} from "../components/CreateModulePage";
import { duplicateConfig, useModuleAdmin } from "../ModuleAdminContext";

/**
 * Create a module. `?from=name` duplicates a module and `?parent=name`
 * prefills the parent of a new child module.
 */
export const NewModulePage = () => {
  const {
    createModule,
    listPrefs,
    loading,
    modules,
    paths,
    remoteChecks,
    views,
  } = useModuleAdmin();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const from = views.find(({ name }) => name === params.get("from"));
  const parent = views.find(({ name }) => name === params.get("parent"));
  const initial = useMemo(
    () =>
      from
        ? duplicateConfig(from)
        : parent
          ? { ...NEW_MODULE_CONFIG, parentModuleId: parent.id }
          : undefined,
    [from, parent],
  );

  if (loading) {
    return (
      <div className="vuuModuleAdmin-loading">
        <Spinner aria-label="Loading modules" />
      </div>
    );
  }

  return (
    <CreateModulePage
      initial={initial}
      key={params.toString()}
      modules={modules}
      onCancel={() =>
        navigate(
          from || parent
            ? paths.module((from ?? parent)?.name ?? "")
            : paths.modules(listPrefs.status),
        )
      }
      onCreate={createModule}
      remoteChecks={remoteChecks}
      sourceTitle={from?.title}
    />
  );
};
