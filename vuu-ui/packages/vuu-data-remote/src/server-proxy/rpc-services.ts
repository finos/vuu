import { RpcService } from "@finos/vuu-protocol-types";

export const getRpcServiceModule = (service: RpcService): string => {
  switch (service) {
    case "TypeAheadRpcHandler":
      return "TYPEAHEAD";
    default:
      return "SIMUL";
  }
};
