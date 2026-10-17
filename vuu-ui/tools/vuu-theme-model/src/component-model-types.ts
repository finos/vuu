import type { SourceLocation } from "./theme-model-types.ts";

export const COMPONENT_MODEL_SCHEMA_VERSION = 1;

/**
 * Configuration of the components described by a component model. Paths are
 * relative to `root`, which is itself relative to the config file.
 */
export interface ComponentModelConfig {
  root?: string;
  libraries: ComponentLibraryConfig[];
}

export interface ComponentLibraryConfig {
  id: string;
  label: string;
  /** default css sources for components of this library */
  css?: string[];
  components: ComponentConfig[];
}

export interface ComponentConfig {
  /** defaults to `<library id>-<label>`, lower kebab case */
  id?: string;
  label: string;
  /** css sources, defaults to the library css */
  css?: string[];
  /**
   * When given, only rules whose selector includes one of these class names
   * (or a modifier of one, e.g. saltButton-primary) are included. Rules nested
   * within an included rule are included too.
   */
  classes?: string[];
}

/** A css declaration, within a component's css, that uses var() */
export interface ComponentDeclaration {
  /** selector, with nesting resolved */
  selector: string;
  atRules?: string[];
  property: string;
  value: string;
  /** every custom property referenced, including those in var() fallbacks */
  references: string[];
  location: SourceLocation;
}

export interface ThemeComponent {
  id: string;
  label: string;
  library: string;
  /** css source files, relative to the config root */
  sources: string[];
  declarations: ComponentDeclaration[];
}

export interface ComponentLibrary {
  id: string;
  label: string;
  components: ThemeComponent[];
}

/**
 * The custom properties referenced by the css of a set of components. The
 * model is independent of any theme, references are matched to theme tokens
 * by the consumer.
 */
export interface ComponentModel {
  schemaVersion: number;
  libraries: ComponentLibrary[];
}
