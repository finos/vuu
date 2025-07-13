import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { IServerProxy } from "./IServerProxy";
import { MessageHandler } from "./IWebsocket";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";

export class MockServerWithWorker implements IServerProxy {
  subscribe: (clientMessageHandler: MessageHandler<DataSourceRow>) => void;
  setRange: (range: VuuRange) => void;
}
