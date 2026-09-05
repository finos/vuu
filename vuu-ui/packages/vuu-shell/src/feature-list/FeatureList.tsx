import {
  GridLayout,
  GridLayoutItem,
  toJsonValue,
  useDraggable,
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
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  useCallback,
  useMemo,
  type DragEvent,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";

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
  id,
  index,
  template,
}: {
  readonly id: string;
  readonly index: number;
  readonly template: TypedComponentTemplate;
}) => {
  const getDragSource = useCallback(
    (event: DragEvent<Element>): TemplateSource => ({
      ...template,
      element: event.currentTarget as HTMLElement,
      layoutId: id,
      type: "template",
    }),
    [id, template],
  );
  const draggable = useDraggable({ getDragSource });
  return (
    <GridLayoutItem
      id={`${id}-item-${index}`}
      style={{ gridArea: `${index + 1}/1/${index + 2}/2` }}
    >
      <div {...draggable} draggable>
        <Icon name="draggable" size={18} />
        <span className={`${classBase}-itemName`}>{template.label}</span>
      </div>
    </GridLayoutItem>
  );
};

const TemplateGrid = ({
  id,
  templates,
}: {
  readonly id: string;
  readonly templates: readonly TypedComponentTemplate[];
}) => (
  <GridLayout
    colsAndRows={{
      cols: ["1fr"],
      rows: templates.map(() => "40px"),
    }}
    id={id}
  >
    {templates.map((template, index) => (
      <FeatureTemplate
        id={id}
        index={index}
        key={`${template.component.type}-${template.label}-${index}`}
        template={template}
      />
    ))}
  </GridLayout>
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
        <TemplateGrid
          id="vuu-static-feature-templates"
          key="static"
          templates={features.map(templateForStaticFeature)}
        />,
      ];
    }
    if (Array.isArray(features)) {
      return [
        <div className={`${classBase}-standalone`} key="dynamic">
          <TemplateGrid
            id="vuu-dynamic-feature-templates"
            templates={features.map(templateForDynamicFeature)}
          />
        </div>,
      ];
    }
    return Object.entries(features).map(([heading, featureList], index) => (
      <div className={`${classBase}-group`} key={heading}>
        <div className={`${classBase}-groupHeader`}>{heading}</div>
        <TemplateGrid
          id={`vuu-feature-template-group-${index}`}
          templates={featureList.map(templateForDynamicFeature)}
        />
      </div>
    ));
  }, [features]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
