import { FilterDescriptor } from "../saved-filters/useSavedFilterPanel";

export function findFilter(
  filterDescriptors: FilterDescriptor[],
  filterId: string,
  throwIfNotFound?: true,
): FilterDescriptor;
export function findFilter(
  filterDescriptors: FilterDescriptor[],
  filterId: string,
  throwIfNotFound: false,
): FilterDescriptor | undefined;
export function findFilter(
  filterDescriptors: FilterDescriptor[],
  filterId: string,
  throwIfNotFound = true,
) {
  const filter = filterDescriptors.find(({ id }) => id === filterId);
  if (filter) {
    return filter;
  } else if (throwIfNotFound) {
    throw Error(`[FilterProvider] findFilter, filter not found ${filterId}`);
  }
}

export const deactivateFilter = (filterDescriptors: FilterDescriptor[]) =>
  activateFilter(filterDescriptors, undefined);

export const activateFilter = (
  filterDescriptors: FilterDescriptor[],
  activeFilterId?: string,
) =>
  filterDescriptors.map<FilterDescriptor>((f) => {
    if (f.id === activeFilterId) {
      return {
        ...f,
        active: !f.active,
      };
    } else if (f.active) {
      return {
        ...f,
        active: false,
      };
    } else {
      return f;
    }
  });

export const insertOrReplaceFilter = (
  filterDescriptors: FilterDescriptor[],
  filterDescriptor: FilterDescriptor,
) => {
  if (!filterDescriptors.some(({ id }) => id === filterDescriptor.id)) {
    return deactivateFilter(filterDescriptors).concat(filterDescriptor);
  } else {
    return filterDescriptors.map<FilterDescriptor>((f) => {
      if (f.id === filterDescriptor.id) {
        return filterDescriptor;
      } else if (f.active) {
        return {
          ...f,
          active: false,
        };
      } else {
        return f;
      }
    });
  }
};

export const renameFilter = (
  filterDescriptors: FilterDescriptor[],
  filterId: string,
  name: string,
) =>
  filterDescriptors.map<FilterDescriptor>((f) => {
    if (f.id === filterId) {
      return {
        ...f,
        filter: {
          ...f.filter,
          name,
        },
      };
    } else {
      return f;
    }
  });
