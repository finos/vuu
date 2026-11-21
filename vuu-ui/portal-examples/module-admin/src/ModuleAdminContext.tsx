import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  type ModuleCounts,
  type ModuleView,
  type StatusFilter,
  moduleCounts,
  toModuleViews,
} from "./data/module-model";
import { useModuleAdminData } from "./data/useModuleAdminData";
import { type RemoteChecks, useRemoteChecks } from "./data/useRemoteChecks";

/** How the module detail pane shows the config. */
export type DetailView = "fields" | "yaml";

/** Absolute paths for the views of Module Admin. */
export interface ModulePaths {
  base: string;
  modules: string;
  module: (name: string) => string;
  menu: string;
}

export const modulePaths = (base: string): ModulePaths => ({
  base,
  menu: `${base}/menu`,
  module: (name) => `${base}/modules/${encodeURIComponent(name)}`,
  modules: `${base}/modules`,
});

/**
 * The path Module Admin is mounted at. The portal mounts a remote module at
 * `${path}/*`, so the base is the location without the splat.
 */
export const useModuleBase = () => {
  const { pathname } = useLocation();
  const splat = useParams()["*"] ?? "";
  const depth = splat.split("/").filter(Boolean).length;
  const segments = pathname.split("/").filter(Boolean);
  const base = segments.slice(0, segments.length - depth).join("/");
  return base ? `/${base}` : "";
};

export interface ModuleAdminState {
  counts: ModuleCounts;
  detailView: DetailView;
  error?: string;
  filter: string;
  loading: boolean;
  paths: ModulePaths;
  remoteChecks: RemoteChecks;
  setDetailView: (view: DetailView) => void;
  setFilter: (filter: string) => void;
  setStatus: (status: StatusFilter) => void;
  status: StatusFilter;
  /** Modules enriched with issues, parent, children and remote status. */
  views: ModuleView[];
}

const ModuleAdminContext = createContext<ModuleAdminState | undefined>(
  undefined,
);

export const useModuleAdmin = () => {
  const context = useContext(ModuleAdminContext);
  if (!context) throw new Error("useModuleAdmin needs a ModuleAdminProvider");
  return context;
};

export const ModuleAdminProvider = ({
  base,
  children,
}: {
  base: string;
  children: ReactNode;
}) => {
  const { error, loading, modules } = useModuleAdminData();
  const remoteChecks = useRemoteChecks();
  const paths = useMemo(() => modulePaths(base), [base]);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [detailView, setDetailView] = useState<DetailView>("fields");

  const { check } = remoteChecks;
  const checkAll = useCallback(
    () => check(modules.map(({ mfUrl }) => mfUrl)),
    [check, modules],
  );

  // Check every remote once, when the modules first arrive.
  const checkedOnLoad = useRef(false);
  useEffect(() => {
    if (!checkedOnLoad.current && !loading && modules.length > 0) {
      checkedOnLoad.current = true;
      void checkAll();
    }
  }, [checkAll, loading, modules.length]);

  const views = useMemo(
    () => toModuleViews(modules, remoteChecks.manifests),
    [modules, remoteChecks.manifests],
  );
  const counts = useMemo(() => moduleCounts(views), [views]);

  const state: ModuleAdminState = {
    counts,
    detailView,
    error,
    filter,
    loading,
    paths,
    remoteChecks,
    setDetailView,
    setFilter,
    setStatus,
    status,
    views,
  };

  return (
    <ModuleAdminContext.Provider value={state}>
      {children}
    </ModuleAdminContext.Provider>
  );
};
