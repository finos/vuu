import type {
  ComponentDeclaration,
  ComponentModel,
  ThemeComponent,
} from "@vuu-ui/vuu-theme-model/src/component-model-types";
import type {
  ThemeTier,
  ThemeToken,
} from "@vuu-ui/vuu-theme-model/src/theme-model-types";

/**
 * Custom properties a component exposes for customisation, e.g.
 * --saltButton-background, --vuuTable-height
 */
export const API_VARIABLE_PATTERN = /^--(vuu|salt)[A-Z]/;

export const isApiVariable = (name: string) => API_VARIABLE_PATTERN.test(name);

export interface ComponentUsage {
  component: ThemeComponent;
  /** theme tokens referenced directly by the component css */
  tokens: ThemeToken[];
  /** API variables referenced by the component css */
  apiVariables: string[];
  /** any other custom properties, private to the component */
  localVariables: string[];
}

export interface ComponentLibraryUsage {
  id: string;
  label: string;
  components: ComponentUsage[];
}

interface TokenLookup {
  token(name: string): ThemeToken | undefined;
}

const unique = <T>(values: T[]) => [...new Set(values)];

/**
 * Matches the custom properties referenced by component css to the tokens of
 * a theme, in both directions.
 */
export class ComponentIndex {
  readonly libraries: ComponentLibraryUsage[];
  private byId = new Map<string, ComponentUsage>();
  private byToken = new Map<string, ComponentUsage[]>();

  constructor(
    model: ComponentModel,
    themeIndex: TokenLookup,
    tiers: ThemeTier[],
  ) {
    this.libraries = model.libraries.map((library) => ({
      id: library.id,
      label: library.label,
      components: library.components.map((component) => {
        const references = unique(
          component.declarations.flatMap((d) => d.references),
        );
        const tokens: ThemeToken[] = [];
        const apiVariables: string[] = [];
        const localVariables: string[] = [];
        for (const name of references) {
          const token = themeIndex.token(name);
          if (token && tiers.includes(token.tier)) {
            tokens.push(token);
          } else if (isApiVariable(name)) {
            apiVariables.push(name);
          } else if (!token) {
            localVariables.push(name);
          }
        }
        const usage: ComponentUsage = {
          component,
          tokens: tokens.sort(
            (a, b) =>
              tiers.indexOf(a.tier) - tiers.indexOf(b.tier) ||
              a.name.localeCompare(b.name),
          ),
          apiVariables: apiVariables.sort(),
          localVariables: localVariables.sort(),
        };
        this.byId.set(component.id, usage);
        for (const token of tokens) {
          const users = this.byToken.get(token.name) ?? [];
          users.push(usage);
          this.byToken.set(token.name, users);
        }
        return usage;
      }),
    }));
  }

  get size() {
    return this.byId.size;
  }

  usage(id: string) {
    return this.byId.get(id);
  }

  /** components whose css references the token directly */
  componentsUsing(tokenName: string): ComponentUsage[] {
    return this.byToken.get(tokenName) ?? [];
  }
}

/** declarations of a component that reference the given custom property */
export const declarationsUsing = (
  component: ThemeComponent,
  name: string,
): ComponentDeclaration[] =>
  component.declarations.filter((d) => d.references.includes(name));

export const COMPONENT_ID_PREFIX = "component:";
export const componentKey = (id: string) => `${COMPONENT_ID_PREFIX}${id}`;
