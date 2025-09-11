import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { SessionEditingForm } from "@vuu-ui/vuu-data-react";
import { HTMLAttributes, MouseEventHandler, useMemo } from "react";
import {
  ContextMenuItemDescriptor,
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
  useContextMenu,
} from "@vuu-ui/vuu-context-menu";
import { ModalProvider, useModal } from "@vuu-ui/vuu-ui-controls";

const openFile: ActionWithParams = {
  id: "openFile",
  description: "open a file",
  confirmation: true,
  params: [
    {
      name: "file",
      type: "string",
      description: "Raw file name",
      required: true,
    },
  ],
};

const setLogLevel: ActionWithParams = {
  id: "setLogLevel",
  description: "set a log level",
  params: [
    { name: "level", type: "int", description: "log level" },
    { name: "topic", type: "string", description: "log topic" },
  ],
};

const actionDescriptors: { [key: string]: ActionDescriptor } = {
  action1: {
    id: "action1",
    description: "menu action one",
    confirmation: true,
  },
  action2: { id: "action2", description: "menu action two" },
  setLogLevel,
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
  openFile,
};

export const SingleFieldForm = () => {
  return (
    <SessionEditingForm
      config={{
        key: "key",
        title: openFile.description,
        fields: openFile.params,
      }}
      dataSource={getDataSource(openFile)}
      style={{ border: "solid 1px black", margin: 30, width: 300 }}
    />
  );
};

export const TwinFieldForm = () => {
  return (
    <SessionEditingForm
      config={{
        key: "key",
        title: setLogLevel.description,
        fields: setLogLevel.params,
      }}
      dataSource={getDataSource(setLogLevel)}
      style={{ border: "solid 1px black", margin: 30, width: 300 }}
    />
  );
};

const ComponentWithMenu = ({
  location,
  ...props
}: HTMLAttributes<HTMLDivElement> & { location: "left" | "right" }) => {
  const showContextMenu = useContextMenu();
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
    col.name === "key" ? key : initialValue(col.serverDataType),
  );

const getDataSource = (action: ActionWithParams): DataSource => {
  const columnDescriptors: ColumnDescriptor[] = [{ name: "key" }].concat(
    action.params.map((param) => ({
      name: param.name,
      serverDataType: param.type,
    })),
  );

  return new ArrayDataSource({
    columnDescriptors,
    data: [emptyRow("key-0", columnDescriptors)],
  });
};

const ContextMenuActionsTemplate = () => {
  const { showPrompt } = useModal();

  const menuDescriptors: ContextMenuItemDescriptor[] = useMemo(
    () => [
      { label: "Menu Action 1, no Parameters", id: "id1" },
      { label: "Menu id 2, no Parameters", id: "id2" },
      { label: "Set Log Level ...", id: "setLogLevel" },
      { label: "Switch Connection List", id: "switchConnectionList" },
      { label: "Fix status", id: "fixStatus" },
      { label: "Fix HB interval ...", id: "fixHbInterval" },
      { label: "Set Inbound Fix ...", id: "setInboundFix" },
      { label: "Set Outbound Fix ...", id: "setOutboundFix" },
      { label: "Load File ...", id: "loadFile" },
    ],
    [],
  );

  const handleMenuAction: MenuActionHandler = (menuItemId) => {
    const actionDescriptor = actionDescriptors[menuItemId];
    if (hasParams(actionDescriptor)) {
      showPrompt(
        <SessionEditingForm
          config={{
            key: "",
            title: actionDescriptor.description,
            fields: actionDescriptor.params,
          }}
          dataSource={getDataSource(actionDescriptor)}
        />,
        { title: "Edit Parameters" },
      );
    }
    return true;
  };

  const menuBuilder: MenuBuilder = (location: string) =>
    menuDescriptors.filter(
      (descriptor) =>
        descriptor.location === undefined || descriptor.location === location,
    );

  return (
    <ContextMenuProvider
      menuBuilder={menuBuilder}
      menuActionHandler={handleMenuAction}
    >
      <ComponentWithMenu
        style={{ height: 200, width: 200, backgroundColor: "red" }}
        location="left"
      />
    </ContextMenuProvider>
  );
};

export const ContextMenuActions = () => (
  <ModalProvider>
    <ContextMenuActionsTemplate />
  </ModalProvider>
);
