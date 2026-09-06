import {
  DragDropProviderNext,
  GridLayoutProvider,
  toJsonValue,
  useDraggable,
  useOptionalDragContext,
  type TemplateSource,
  type TypedComponentTemplate,
} from "@heswell/grid-layout";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  type DynamicFeatureProps,
  type StaticFeatureDescriptor,
  isStaticFeatures,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  useCallback,
  useId,
  useMemo,
  type DragEvent,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";
const NOOP = () => undefined;

const FeatureListDragRuntime = ({ children }: { children: ReactNode }) => {
  const dragContext = useOptionalDragContext();
  const runtimeId = useId();

  if (dragContext) {
    return children;
  }

  return (
    <GridLayoutProvider>
      <DragDropProviderNext
        dragSources={{}}
        onCancelTabDrag={NOOP}
        onDetachTab={NOOP}
        onDrop={NOOP}
      >
        <div
          className="vuuGridLayout"
          id={`vuu-feature-list-${runtimeId}`}
          style={{ display: "contents" }}
        >
          {children}
        </div>
      </DragDropProviderNext>
    </GridLayoutProvider>
  );
};

export type GroupedFeatureProps<P extends object | undefined = object> = Record<
  string,
  DynamicFeatureProps<P>[]
>;

export interface FeatureListProps extends HTMLAttributes<HTMLDivElement> {
  readonly features:
    | DynamicFeatureProps[]
    | GroupedFeatureProps
    | StaticFeatureDescriptor[];
}

const templateForDynamicFeature = (
  feature: DynamicFeatureProps,
): TypedComponentTemplate => {
  const settings = toJsonValue(feature);
  if (!settings.ok) {
    throw new Error(
      `Feature "${feature.title ?? feature.mfComponent}" has non-persistable settings at ${settings.error.path}`,
    );
  }
  return {
    component: {
      settings: settings.value,
      type: "vuu-dynamic-feature",
      version: 1,
    },
    label: feature.title ?? feature.mfComponent,
  };
};

const templateForStaticFeature = ({
  label,
  type,
}: StaticFeatureDescriptor): TypedComponentTemplate => ({
  component: {
    settings: { type },
    type: "vuu-static-feature",
    version: 1,
  },
  label,
});

const FeatureTemplate = ({
  template,
}: {
  readonly template: TypedComponentTemplate;
}) => {
  const getDragSource = useCallback(
    (event: DragEvent<Element>): TemplateSource => {
      const element = event.currentTarget as HTMLElement;
      return {
        ...template,
        element,
        layoutId:
          queryClosest(element, ".vuuGridLayout")?.id ?? "vuu-feature-list",
        type: "template",
      };
    },
    [template],
  );
  const draggable = useDraggable({ getDragSource });
  return (
    <div
      {...draggable}
      className={`${classBase}-item`}
      data-template-component-type={template.component.type}
      data-template-version={template.component.version}
      draggable
    >
      <Icon name="draggable" size={18} />
      <span className={`${classBase}-itemName`}>{template.label}</span>
    </div>
  );
};

const TemplateList = ({
  templates,
}: {
  readonly templates: readonly TypedComponentTemplate[];
}) => (
  <div className={`${classBase}-items`}>
    {templates.map((template, index) => (
      <FeatureTemplate
        key={`${template.component.type}-${template.label}-${index}`}
        template={template}
      />
    ))}
  </div>
);

export const FeatureList = ({
  features,
  title = "VUU TABLES",
  ...htmlAttributes
}: FeatureListProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-feature-list",
    css: featureListCss,
    window: targetWindow,
  });

  const content = useMemo<ReactElement[]>(() => {
    if (isStaticFeatures(features)) {
      return [
        <TemplateList
          key="static"
          templates={features.map(templateForStaticFeature)}
        />,
      ];
    }
    if (Array.isArray(features)) {
      return [
        <div className={`${classBase}-standalone`} key="dynamic">
          <TemplateList templates={features.map(templateForDynamicFeature)} />
        </div>,
      ];
    }
    return Object.entries(features).map(([heading, featureList]) => (
      <div className={`${classBase}-group`} key={heading}>
        <div className={`${classBase}-groupHeader`}>{heading}</div>
        <TemplateList templates={featureList.map(templateForDynamicFeature)} />
      </div>
    ));
  }, [features]);

  return (
    <FeatureListDragRuntime>
      <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
        <div className={`${classBase}-header`}>{title}</div>
        <div className={`${classBase}-content`}>{content}</div>
      </div>
    </FeatureListDragRuntime>
  );
};
