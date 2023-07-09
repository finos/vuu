import { Options } from "cypress-axe";
import type { MountOptions, MountReturn } from "cypress/react";
import { ReactNode } from "react";

// Must be declared global to be detected by typescript (allows import/export)
declare global {
  type SupportedThemeMode = "light" | "dark";
  type SupportedDensity = "touch" | "low" | "medium" | "high";
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // unsure why this Subject is unused, nor what to do with it...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      /**
       * Set Theme Mode
       * @example
       * cy.setMode('light')
       */
      setMode(theme: SupportedThemeMode): Chainable<void>;

      /**
       * Set Density
       *
       * @example
       * cy.setDensity('medium')
       */
      setDensity(theme: SupportedDensity): Chainable<void>;

      /**
       * Set Density
       *
       * @example
       * cy.checkAxeComponent()
       */
      checkAxeComponent(
        options?: Options,
        enableFailures?: boolean
      ): Chainable<void>;

      mountPerformance: (
        jsx: ReactNode,
        options?: MountOptions
      ) => Chainable<MountReturn>;
      mount: (jsx: ReactNode, options?: MountOptions) => Chainable<MountReturn>;

      getRenderCount(): Chainable<number>;

      getRenderTime(): Chainable<number>;

      paste(string: string): Chainable<void>;
    }
  }
}
