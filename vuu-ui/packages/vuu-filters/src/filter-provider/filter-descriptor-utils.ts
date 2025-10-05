import { FilterContainerFilterDescriptor } from "@vuu-ui/vuu-filter-types";

export function findFilter(
  filterDescriptors: FilterContainerFilterDescriptor[],
  filterId: string,
  throwIfNotFound?: true,
): FilterContainerFilterDescriptor;
export function findFilter(
  filterDescriptors: FilterContainerFilterDescriptor[],
  filterId: string,
  throwIfNotFound: false,
): FilterContainerFilterDescriptor | undefined;
export function findFilter(
  filterDescriptors: FilterContainerFilterDescriptor[],
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

export const deactivateFilter = (
  filterDescriptors: FilterContainerFilterDescriptor[],
) => activateFilter(filterDescriptors, undefined);

export const activateFilter = (
  filterDescriptors: FilterContainerFilterDescriptor[],
  activeFilterId?: string,
) =>
  filterDescriptors.map<FilterContainerFilterDescriptor>((f) => {
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
  filterDescriptors: FilterContainerFilterDescriptor[],
  filterDescriptor: FilterContainerFilterDescriptor,
) => {
  if (!filterDescriptors.some(({ id }) => id === filterDescriptor.id)) {
    return deactivateFilter(filterDescriptors).concat(filterDescriptor);
  } else {
    return filterDescriptors.map<FilterContainerFilterDescriptor>((f) => {
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
  filterDescriptors: FilterContainerFilterDescriptor[],
  filterId: string,
  name: string,
) =>
  filterDescriptors.map<FilterContainerFilterDescriptor>((f) => {
    if (f.id === filterId && f.filter !== null) {
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
