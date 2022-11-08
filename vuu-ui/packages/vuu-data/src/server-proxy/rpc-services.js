export const getRpcService = (method) => {
  switch (method) {
    case "getUniqueFieldValues":
    case "getUniqueFieldValuesStartingWith":
      return ["TypeAheadRpcHandler", "TYPEAHEAD"];
    default:
      return ["OrderEntryRpcHandler", "SIMUL"];
  }
};
