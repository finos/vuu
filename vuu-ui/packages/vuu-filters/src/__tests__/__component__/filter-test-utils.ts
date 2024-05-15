const FILTER_CONTAINER = ".vuuCustomFilters-filters";

export const findFilterPill = (index = 0) =>
  cy.get(FILTER_CONTAINER).find(`.vuuFilterPill[data-index="${index}"]`);

export const clickFilterPillTrigger = (index = 0) => {
  cy.get(FILTER_CONTAINER)
    .find(`.vuuFilterPill[data-index="${index}"]`)
    .find(".vuuSplitButton-trigger")
    .realClick();
};

export const clickMenuItem = (name: string) => {
  cy.findByRole("menuitem", { name }).realHover();
  cy.findByRole("menuitem", { name }).realClick();
};
