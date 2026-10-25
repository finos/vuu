import type {
  GridComponentSettingsCodec,
  GridSettingsCodecResult,
  JsonValue,
  TypedComponentTemplate,
} from "@vuu-ui/grid-layout";
import { type ReactNode, useMemo } from "react";
import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import { PortalModuleIdContext } from "../notifications/PortalNotificationsContext";
import { usePortalModuleRegistry } from "../portal-module-registry/PortalModuleRegistry";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { RemoteModule } from "../remote-module/RemoteModule";
import type { WorkspaceComponentRegistration } from "../workspace/workspace-component-registry";
import {
  invalidSettings,
  isJsonValue,
  isNonEmptyString,
  isRecord,
} from "./settings-validation";

export const PORTAL_MODULE_COMPONENT_TYPE = "portal-module";

/**
 * Settings of a `portal-module` workspace item. The module is resolved
 * against the live module registry when the item renders, so its
 * Module Federation location is never persisted.
 */
export interface PortalModuleComponentSettings {
  /** The module's `id`; its `clientIdentifier` or `name` is also accepted. */
  readonly moduleId: string;
  /** Extra props passed to the module's component. */
  readonly props?: JsonValue;
}

export const isPortalModuleComponentSettings = (
  value: unknown,
): value is PortalModuleComponentSettings =>
  isRecord(value) &&
  isNonEmptyString(value.moduleId) &&
  (value.props === undefined ||
    (isRecord(value.props) && isJsonValue(value.props)));

const validatePortalModuleSettings = (
  value: unknown,
): GridSettingsCodecResult<PortalModuleComponentSettings> => {
  if (!isRecord(value)) {
    return invalidSettings("$", "portal-module settings must be an object");
  }
  if (!isNonEmptyString(value.moduleId)) {
    return invalidSettings(
      "$.moduleId",
      "portal-module settings require a non-empty moduleId",
    );
  }
  if (value.props !== undefined && !isRecord(value.props)) {
    return invalidSettings("$.props", "portal-module props must be an object");
  }
  if (value.props !== undefined && !isJsonValue(value.props)) {
    return invalidSettings("$.props", "portal-module props must be JSON");
  }
  const settings: PortalModuleComponentSettings =
    value.props === undefined
      ? { moduleId: value.moduleId }
      : { moduleId: value.moduleId, props: value.props as JsonValue };
  return { ok: true, value: settings };
};

export const portalModuleSettingsCodec: GridComponentSettingsCodec<PortalModuleComponentSettings> =
  {
    decode: validatePortalModuleSettings,
    encode: validatePortalModuleSettings,
    isSettings: isPortalModuleComponentSettings,
    version: 1,
  };

/** Builds the drag/persist template for a `portal-module` workspace item. */
export const portalModuleTemplate = (
  module: Pick<RemoteModuleDescriptor, "id" | "title">,
  props?: JsonValue,
): TypedComponentTemplate => ({
  component: {
    settings:
      props === undefined
        ? { moduleId: String(module.id) }
        : { moduleId: String(module.id), props },
    type: PORTAL_MODULE_COMPONENT_TYPE,
    version: portalModuleSettingsCodec.version,
  },
  label: module.title,
});

/**
 * The registered modules: those of the nearest PortalModuleRegistryProvider,
 * else the identity provider's module registry.
 */
export const useRegisteredModules = (): readonly RemoteModuleDescriptor[] => {
  const { remoteModules } = usePortalModuleRegistry();
  const identityModules = useOptionalIdentityContext()?.moduleRegistry?.modules;
  return remoteModules.length > 0 ? remoteModules : (identityModules ?? []);
};

export const findPortalModule = (
  modules: readonly RemoteModuleDescriptor[],
  moduleId: string,
) =>
  modules.find(({ id }) => String(id) === moduleId) ??
  modules.find(
    ({ clientIdentifier, name }) =>
      clientIdentifier === moduleId || name === moduleId,
  );

const classBase = "vuuPortalModuleComponent";

/**
 * Renders a resolved, enabled module. The default renders the module's
 * remote component with `RemoteModule`.
 */
export type PortalModuleRenderer = (
  descriptor: RemoteModuleDescriptor,
  props: Record<string, unknown> | undefined,
) => ReactNode;

export interface PortalModuleComponentOptions {
  renderModule?: PortalModuleRenderer;
}

const renderRemoteModule: PortalModuleRenderer = (descriptor, props) => {
  const {
    clientIdentifier,
    contextPanelPlacement,
    mfComponent,
    mfExport,
    mfScope,
    mfUrl,
    persistenceKey,
    title,
    version,
  } = descriptor;
  return (
    <RemoteModule
      {...props}
      clientIdentifier={clientIdentifier}
      contextPanelPlacement={contextPanelPlacement}
      mfComponent={mfComponent}
      mfExport={mfExport}
      mfScope={mfScope}
      mfUrl={mfUrl}
      persistenceKey={persistenceKey}
      title={title}
      version={version}
    />
  );
};

export interface PortalModuleComponentProps
  extends PortalModuleComponentSettings,
    PortalModuleComponentOptions {}

export const PortalModuleComponent = ({
  moduleId,
  props,
  renderModule = renderRemoteModule,
}: PortalModuleComponentProps) => {
  const modules = useRegisteredModules();
  const descriptor = useMemo(
    () => findPortalModule(modules, moduleId),
    [moduleId, modules],
  );

  if (!descriptor || descriptor.enabled === false) {
    return (
      <div
        className={`${classBase}-unavailable`}
        data-module-id={moduleId}
        role="alert"
      >
        {descriptor
          ? `The module "${descriptor.title}" is disabled.`
          : `The module "${moduleId}" is not available, or you do not have access to it.`}
      </div>
    );
  }

  return (
    <PortalModuleIdContext.Provider value={descriptor.id}>
      {renderModule(descriptor, props as Record<string, unknown> | undefined)}
    </PortalModuleIdContext.Provider>
  );
};

export const createPortalModuleComponentRegistration = ({
  renderModule,
}: PortalModuleComponentOptions = {}): WorkspaceComponentRegistration<PortalModuleComponentSettings> => ({
  codec: portalModuleSettingsCodec,
  render: (settings) => (
    <PortalModuleComponent {...settings} renderModule={renderModule} />
  ),
  type: PORTAL_MODULE_COMPONENT_TYPE,
});

export const portalModuleComponentRegistration =
  createPortalModuleComponentRegistration();
