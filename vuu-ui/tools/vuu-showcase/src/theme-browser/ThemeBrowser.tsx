import type { ComponentModel } from "@vuu-ui/vuu-theme-model/src/component-model-types";
import type { ThemeModel } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CharacteristicView } from "./CharacteristicView";
import { ComponentIndex } from "./component-utils";
import { DiagnosticsView } from "./DiagnosticsView";
import { FoundationsView } from "./FoundationsView";
import { Header } from "./Header";
import { Axes, defaultAxes, ThemeIndex, TIERS } from "./model-utils";
import { loadComponentModel, ThemeSource, themeSources } from "./theme-sources";
import {
  ThemeBrowserContext,
  ThemeBrowserContextProps,
  ThemeBrowserViewId,
} from "./ThemeBrowserContext";
import { ThemeSandbox } from "./ThemeSandbox";
import { TiersView } from "./TiersView";
import { TileButton } from "./TileButton";

import "./ThemeBrowser.css";

const SUPPORTED_SCHEMA_VERSION = 1;
const DEFAULT_SELECTION = "--salt-actionable-bold-background";
const SHOW_COMPONENTS_KEY = "vuu-theme-browser:show-components";

const readShowComponents = () => {
  try {
    return localStorage.getItem(SHOW_COMPONENTS_KEY) === "true";
  } catch {
    return false;
  }
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      model: ThemeModel;
      index: ThemeIndex;
      sandbox: ThemeSandbox;
    };

const defaultSelection = (index: ThemeIndex) =>
  index.token(DEFAULT_SELECTION)
    ? DEFAULT_SELECTION
    : index.model.groups.characteristics[0]?.tokens[0];

export interface ThemeBrowserProps {
  /** id of the theme source shown initially */
  defaultTheme?: string;
  sources?: ThemeSource[];
  /** name of a token to select, e.g. from a deep link */
  token?: string;
}

/**
 * Read-only browser for a Salt theme, organised by the three Salt tiers:
 * foundations, palette and characteristics. The theme is described by a model
 * generated at build time (tools/vuu-theme-model).
 */
export const ThemeBrowser = ({
  defaultTheme,
  sources = themeSources,
  token,
}: ThemeBrowserProps) => {
  const [sourceId, setSourceId] = useState(defaultTheme ?? sources[0]?.id);
  const source = sources.find((s) => s.id === sourceId) ?? sources[0];
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [axes, setAxes] = useState<Axes>({});
  const [view, setView] = useState<ThemeBrowserViewId>("tiers");
  const [selected, setSelected] = useState<string | undefined>();
  const [characteristic, setCharacteristic] = useState<string | undefined>();
  const [componentModel, setComponentModel] = useState<ComponentModel>();
  const [selectedComponent, setSelectedComponent] = useState<string>();
  const [showComponents, setShowComponentsState] = useState(readShowComponents);

  const setShowComponents = useCallback((show: boolean) => {
    setShowComponentsState(show);
    if (!show) {
      // the token selected before the component is restored
      setSelectedComponent(undefined);
    }
    try {
      localStorage.setItem(SHOW_COMPONENTS_KEY, String(show));
    } catch {
      // persistence is optional
    }
  }, []);

  useEffect(() => {
    // the component model is optional, without it the components column is
    // not offered
    loadComponentModel()
      .then(({ model }) => {
        if (model?.schemaVersion === SUPPORTED_SCHEMA_VERSION) {
          setComponentModel(model);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let sandbox: ThemeSandbox | undefined;
    let cancelled = false;
    setLoadState({ status: "loading" });
    source
      ?.load()
      .then(({ model, stylesheet }) => {
        if (cancelled) return;
        if (model?.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
          throw Error(
            `theme model schema version ${model?.schemaVersion} is not supported, regenerate it with 'npm run build:theme-model'`,
          );
        }
        const index = new ThemeIndex(model);
        sandbox = new ThemeSandbox(model, stylesheet, index.rootClasses);
        setAxes(defaultAxes(model));
        setSelected((current) =>
          current && index.token(current) ? current : defaultSelection(index),
        );
        setLoadState({ status: "ready", model, index, sandbox });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadState({ status: "error", message: String(err?.message) });
        }
      });
    return () => {
      cancelled = true;
      sandbox?.dispose();
    };
  }, [source]);

  const ready = loadState.status === "ready" ? loadState : undefined;

  const components = useMemo(
    () =>
      ready && componentModel
        ? new ComponentIndex(componentModel, ready.index, TIERS)
        : undefined,
    [componentModel, ready],
  );

  const select = useCallback(
    (name: string, targetView?: ThemeBrowserViewId) => {
      const token = ready?.index.token(name);
      if (!token) return;
      setSelected(name);
      setSelectedComponent(undefined);
      if (targetView) {
        setView(targetView);
      } else if (view === "characteristic") {
        // stay in the characteristic view while the selection is meaningful
        if (token.tier === "characteristics") {
          setCharacteristic(token.group);
        } else {
          setView("tiers");
        }
      }
    },
    [ready, view],
  );

  const selectComponent = useCallback(
    (id: string) => {
      if (components?.usage(id)) {
        setSelectedComponent(id);
        setShowComponentsState(true);
        setView("tiers");
      }
    },
    [components],
  );

  // a requested token is selected once, the user can then browse away from it
  const appliedToken = useRef<string>(undefined);
  useEffect(() => {
    if (ready && token && token !== appliedToken.current) {
      appliedToken.current = token;
      select(token, "tiers");
    }
  }, [ready, select, token]);

  const contextValue = useMemo<ThemeBrowserContextProps | undefined>(
    () =>
      ready
        ? {
            axes,
            components,
            index: ready.index,
            model: ready.model,
            resolve: (name: string, scopeAxes = axes) =>
              ready.sandbox.resolve(name, scopeAxes),
            sandbox: ready.sandbox,
            select,
            selected,
            selectComponent,
            selectedComponent:
              components && showComponents ? selectedComponent : undefined,
            setAxes,
            setShowComponents,
            showComponents: showComponents && components !== undefined,
          }
        : undefined,
    [
      axes,
      components,
      ready,
      select,
      selectComponent,
      selected,
      selectedComponent,
      setShowComponents,
      showComponents,
    ],
  );

  if (!contextValue || !source) {
    return (
      <div className="vuuThemeBrowser">
        <div className="status-panel">
          {loadState.status === "error" ? (
            <>
              <h2>Theme model not available</h2>
              <p>
                The model for <b>{source?.label ?? sourceId}</b> could not be
                loaded. Theme models are generated at build time, from{" "}
                <code>vuu-ui</code> run:
              </p>
              <pre>npm run build:theme-model</pre>
              <p className="muted mono">{loadState.message}</p>
              {sources.length > 1 ? (
                <p>
                  {sources
                    .filter((s) => s !== source)
                    .map((s) => (
                      <TileButton
                        className="ghost"
                        key={s.id}
                        onClick={() => setSourceId(s.id)}
                      >
                        Try {s.label}
                      </TileButton>
                    ))}
                </p>
              ) : null}
            </>
          ) : (
            <p className="muted">Loading theme…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ThemeBrowserContext.Provider value={contextValue}>
      <div className="vuuThemeBrowser" data-view={view}>
        <Header
          onChangeTheme={setSourceId}
          onChangeView={setView}
          sourceId={source.id}
          sources={sources}
          view={view}
        />
        {view === "characteristic" ? (
          <CharacteristicView
            characteristic={characteristic}
            onSelectCharacteristic={setCharacteristic}
          />
        ) : view === "foundations" ? (
          <FoundationsView />
        ) : view === "diagnostics" ? (
          <DiagnosticsView key={source.id} />
        ) : (
          <TiersView key={source.id} />
        )}
      </div>
    </ThemeBrowserContext.Provider>
  );
};
