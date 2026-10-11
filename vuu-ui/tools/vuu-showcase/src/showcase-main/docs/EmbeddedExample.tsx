import { useMemo } from "react";
import { standaloneUrl } from "../example/preview-state";
import { useShowcaseContext } from "../ShowcaseProvider";
import { useDocsContext } from "./DocsContext";
import { embeddedExampleRoute } from "./docs-model";

export interface EmbeddedExampleProps {
  /** the module the example was imported from, relative to the document */
  module: string;
  /** the export name of the example */
  name: string;
}

/**
 * An example within a document. Documents render in the showcase chrome, the
 * example renders in its own iframe so it is styled by the preview theme. The
 * iframe is sized to fit the example (see ShowcaseStandalone). Usages of
 * examples in mdx are converted to EmbeddedExample at build time, see
 * scripts/remark-embedded-examples.ts.
 */
export const EmbeddedExample = ({ module, name }: EmbeddedExampleProps) => {
  const { docRoute, documentPath } = useDocsContext();
  const { preview } = useShowcaseContext();
  const route = embeddedExampleRoute(docRoute, documentPath, module, name);
  // only theme changes reload the example, mode and density are in the hash
  const src = useMemo(
    () => standaloneUrl(route, preview, null, true),
    [preview, route],
  );
  return (
    <iframe
      className="ShowcaseEmbeddedExample"
      data-embedded-example={name}
      data-route={route}
      loading="lazy"
      src={src}
      title={`${name} example`}
    />
  );
};

export const isEmbeddedExample = (
  element: unknown,
): element is { props: EmbeddedExampleProps } =>
  typeof element === "object" &&
  element !== null &&
  (element as { type?: unknown }).type === EmbeddedExample;
