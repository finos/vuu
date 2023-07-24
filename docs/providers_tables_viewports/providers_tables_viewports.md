import { MdxSection } from "@site/src/components/MdxSection";
import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Core Concepts

<SvgDottySeparator style={{marginBottom: 32}}/>

<MdxSection
  title="Lifecycle"
  titleLink="./lifecycle"
  subTitle="Manages the startup sequence of the server."
  className="vuu-section-2-col-1 lifecycle"
/>
<MdxSection
  title="Providers"
  titleLink="./providers"
  subTitle="Populate Vuu tables from external sources, such as the network."
  className="vuu-section-2-col-2 providers"
/>
<MdxSection
  title="Tables"
  titleLink="./tables"
  subTitle="Store data in memory, subsets of which are displayed via viewports."
  className="vuu-section-2-col-1 tables"
/>
<MdxSection
  title="Viewports"
  titleLink="./viewports"
  subTitle="Are user subscriptions to tables, capturing sort, filter criteria etc."
  className="vuu-section-2-col-2 viewports"
/>
<MdxSection
  title="Filters, Sorts, Trees"
  titleLink="./filter_sort"
  subTitle="Configured per Viewport e.g. per DataTable UI component"
  className="vuu-section-2-col-1 filters-sorts-trees"
/>
<MdxSection
  title="Modules"
  titleLink="./modules"
  subTitle="Reusable configuration units. Define tables, providers, RPC calls etc"
  className="vuu-section-2-col-2 modules"
/>
