import {
  ContextMenuProvider,
  Dialog,
  MenuActionClosePopup,
  useContextMenu,
} from "@finos/vuu-popups";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { HTMLAttributes, MouseEventHandler, useMemo, useState } from "react";
import { SessionEditingForm } from "@finos/vuu-shell";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ArrayDataSource, DataSource } from "@finos/vuu-data";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";

let displaySequence = 0;

const ComponentWithMenu = ({
  location,
  ...props
}: HTMLAttributes<HTMLDivElement> & { location: "left" | "right" }) => {
  const [showContextMenu] = useContextMenu();
  const handleContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
    console.log(`ComponentWithMenu<${location}> handleContextMenu`);
    showContextMenu(e, location, { type: "outer" });
  };
  return <div {...props} onContextMenu={handleContextMenu} />;
};

interface ActionParam {
  name: string;
  type: VuuColumnDataType;
  description: string;
  required?: boolean;
}

interface ActionDescriptor {
  confirmation?: boolean;
  description: string;
  id: string;
  params?: ActionParam[];
}

interface ActionWithParams extends ActionDescriptor {
  params: ActionParam[];
}

const hasParams = (action: ActionDescriptor): action is ActionWithParams =>
  Array.isArray(action?.params);

const actionDescriptors: { [key: string]: ActionDescriptor } = {
  action1: {
    id: "action1",
    description: "menu action one",
    confirmation: true,
  },
  action2: { id: "action2", description: "menu action two" },
  setLogLevel: {
    id: "setLogLevel",
    description: "set a log level",
    params: [
      { name: "level", type: "int", description: "log level" },
      { name: "topic", type: "string", description: "log topic" },
    ],
  },
  fixStatus: { id: "fixStatus", description: "fix status" },
  fixHbInterval: {
    id: "fixHbInterval",
    description: "fix HB interval",
    params: [
      {
        name: "interval",
        description: "value in seconds",
        type: "int",
        required: true,
      },
    ],
  },
  setInboundFix: {
    id: "setInboundFix",
    description: "set the incoming fix sequence number",
    params: [
      {
        name: "inbndseq",
        type: "int",
        description: "next expected inbound sequence number",
        required: true,
      },
    ],
  },
  setOutboundFix: {
    id: "setOutboundFix",
    description: "set the outgoing fix sequence number",
    params: [
      {
        name: "outbndseq",
        type: "int",
        description: "next expected outbound sequence number",
        required: true,
      },
    ],
  },
  loadFile: {
    id: "loadFile",
    description: "load from a raw file",
    confirmation: true,
    params: [
      {
        name: "file",
        type: "string",
        description: "raw file name",
        required: true,
      },
    ],
  },
};

const initialValue = (colType?: VuuColumnDataType) => {
  switch (colType) {
    case "int":
    case "long":
    case "double":
      return 3;
    case "boolean":
      return false;
    default:
      return "";
  }
};

const emptyRow = (key: string, columns: ColumnDescriptor[]) =>
  columns.map((col) =>
    col.name === "key" ? key : initialValue(col.serverDataType)
  );

const getDataSource = (action: ActionWithParams): DataSource => {
  const columnDescriptors: ColumnDescriptor[] = [{ name: "key" }].concat(
    action.params.map((param) => ({
      name: param.name,
      serverDataType: param.type,
    }))
  );

  return new ArrayDataSource({
    columnDescriptors,
    data: [emptyRow("key-0", columnDescriptors)],
  });
};

export const ContextMenuActions = () => {
  const menuDescriptors: ContextMenuItemDescriptor[] = useMemo(
    () => [
      { label: "Menu Action 1, no Parameters", action: "action1" },
      { label: "Menu Action 2, no Parameters", action: "action2" },
      { label: "Set Log Level ...", action: "setLogLevel" },
      { label: "Switch Connection List", action: "switchConnectionList" },
      { label: "Fix status", action: "fixStatus" },
      { label: "Fix HB interval ...", action: "fixHbInterval" },
      { label: "Set Inbound Fix ...", action: "setInboundFix" },
      { label: "Set Outbound Fix ...", action: "setOutboundFix" },
      { label: "Load File ...", action: "loadFile" },
    ],
    []
  );
  const [action, setAction] = useState<ActionWithParams | undefined>();

  const handleMenuAction: MenuActionHandler = (
    action: MenuActionClosePopup
  ) => {
    const actionDescriptor = actionDescriptors[action.menuId];
    if (hasParams(actionDescriptor)) {
      setAction(actionDescriptor);
    }
    return true;
  };

  const menuBuilder: MenuBuilder = (location: string) =>
    menuDescriptors.filter(
      (descriptor) =>
        descriptor.location === undefined || descriptor.location === location
    );

  const closeDialog = () => {
    setAction(undefined);
  };

  return (
    <ContextMenuProvider
      menuBuilder={menuBuilder}
      menuActionHandler={handleMenuAction}
    >
      <ComponentWithMenu
        style={{ height: 200, width: 200, backgroundColor: "red" }}
        location="left"
      />
      <Dialog
        isOpen={action !== undefined}
        onClose={closeDialog}
        title={action?.description}
      >
        {action ? (
          <SessionEditingForm
            config={{
              key: "",
              title: action.description,
              fields: action.params,
            }}
            dataSource={getDataSource(action)}
            onClose={closeDialog}
          />
        ) : null}
      </Dialog>
    </ContextMenuProvider>
  );
};
ContextMenuActions.displaySequence = displaySequence++;
