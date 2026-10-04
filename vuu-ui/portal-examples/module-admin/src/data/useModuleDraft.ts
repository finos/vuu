import {
  defaultAccessRole,
  type ManagedModule,
  type ModuleConfig,
  type ModuleConfigChanges,
  type ModuleValidationErrors,
  validateModuleConfig,
} from "@heswell/module-admin/contracts";
import { useCallback, useMemo, useState } from "react";
import {
  configChanges,
  joinLocation,
  splitLocation,
  suggestName,
  suggestPath,
} from "./module-model";

export type DraftField = keyof ModuleConfig | "section" | "label";

export interface ModuleDraft {
  config: ModuleConfig;
  /** Menu section and label, edited separately and joined into `location`. */
  section: string;
  label: string;
  errors: ModuleValidationErrors;
  /** Errors for fields the user has touched, or all after a submit attempt. */
  visibleErrors: ModuleValidationErrors;
  errorCount: number;
  changes: ModuleConfigChanges;
  dirty: boolean;
  set: <K extends keyof ModuleConfig>(field: K, value: ModuleConfig[K]) => void;
  setLocation: (section: string, label: string) => void;
  touch: (field: DraftField) => void;
  submitted: boolean;
  setSubmitted: (submitted: boolean) => void;
  reset: () => void;
}

/**
 * Editing state for a module configuration. When creating, name, route and
 * access role follow the title and menu location until edited.
 */
export const useModuleDraft = ({
  initial,
  mode,
  modules,
  moduleId,
}: {
  initial: ModuleConfig;
  mode: "create" | "edit";
  modules: readonly ManagedModule[];
  moduleId?: number;
}): ModuleDraft => {
  const [config, setConfig] = useState(initial);
  const [touched, setTouched] = useState<Set<DraftField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [menu, setMenu] = useState(() => {
    const [section, label] = splitLocation(initial.location);
    return { label, section };
  });

  const derive = useCallback(
    (next: ModuleConfig, edited: keyof ModuleConfig | "location") => {
      if (mode !== "create") return next;
      const derived = { ...next };
      if (edited === "title" && !touched.has("name")) {
        derived.name = suggestName(next.title);
      }
      if (
        (edited === "title" || edited === "name") &&
        !touched.has("accessRole") &&
        derived.parentModuleId === 0
      ) {
        derived.accessRole = defaultAccessRole(derived.name);
      }
      if (edited === "location" && !touched.has("path")) {
        const [nextSection, nextLabel] = splitLocation(next.location);
        derived.path = suggestPath(nextSection, nextLabel);
      }
      return derived;
    },
    [mode, touched],
  );

  const set = useCallback(
    <K extends keyof ModuleConfig>(field: K, value: ModuleConfig[K]) => {
      setConfig((current) => {
        const next = { ...current, [field]: value };
        if (field === "parentModuleId") {
          if (value !== 0) {
            next.location = "";
            if (mode === "create" && !touched.has("accessRole")) {
              next.accessRole = "";
            }
          } else {
            next.location = joinLocation(menu.section, menu.label);
            if (mode === "create" && !touched.has("accessRole")) {
              next.accessRole = defaultAccessRole(next.name);
            }
          }
        }
        return derive(next, field);
      });
    },
    [derive, menu, mode, touched],
  );

  const setLocation = useCallback(
    (nextSection: string, nextLabel: string) => {
      setMenu({ label: nextLabel, section: nextSection });
      setConfig((current) =>
        derive(
          { ...current, location: joinLocation(nextSection, nextLabel) },
          "location",
        ),
      );
    },
    [derive],
  );

  const touch = useCallback((field: DraftField) => {
    setTouched((current) =>
      current.has(field) ? current : new Set(current).add(field),
    );
  }, []);

  const errors = useMemo(
    () => validateModuleConfig(config, modules, moduleId),
    [config, modules, moduleId],
  );
  const visibleErrors = useMemo(() => {
    if (submitted) return errors;
    const visible: ModuleValidationErrors = {};
    for (const [field, error] of Object.entries(errors)) {
      const key = field as keyof ModuleConfig;
      if (
        touched.has(key) ||
        (key === "location" && (touched.has("section") || touched.has("label")))
      ) {
        visible[key] = error;
      }
    }
    return visible;
  }, [errors, submitted, touched]);

  const changes = useMemo(
    () => configChanges(initial, config),
    [initial, config],
  );

  const reset = useCallback(() => {
    setConfig(initial);
    const [initialSection, initialLabel] = splitLocation(initial.location);
    setMenu({ label: initialLabel, section: initialSection });
    setTouched(new Set());
    setSubmitted(false);
  }, [initial]);

  return {
    changes,
    config,
    dirty: Object.keys(changes).length > 0,
    errorCount: Object.keys(errors).length,
    errors,
    label: menu.label,
    reset,
    section: menu.section,
    set,
    setLocation,
    setSubmitted,
    submitted,
    touch,
    visibleErrors,
  };
};
