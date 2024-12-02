import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  FormField,
  FormFieldLabel,
  Input,
  Link,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  Panel,
  RadioButton,
  RadioButtonGroup,
  StackLayout,
  Text,
  useAriaAnnouncer,
} from "@salt-ds/core";
import {
  AddIcon,
  BankCheckIcon,
  CloseIcon,
  CreditCardIcon,
  FavoriteIcon,
  HomeIcon,
  LineChartIcon,
  MicroMenuIcon,
  ReceiptIcon,
} from "@salt-ds/icons";
import {
  TabBar,
  TabListNext,
  type TabListNextProps,
  TabNext,
  TabNextAction,
  TabNextPanel,
  TabNextTrigger,
  TabsNext,
} from "@finos/vuu-ui-controls";
import {
  type ChangeEvent,
  type ComponentType,
  type ReactElement,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { TabState } from "@finos/vuu-layout/src/grid-layout/GridLayoutStackedtem";

const tabs = ["Home", "Transactions", "Loans", "Checks", "Liquidity"];
const lotsOfTabs = [
  "Home",
  "Transactions",
  "Loans",
  "Checks",
  "Liquidity",
  "With",
  "Lots",
  "More",
  "Additional",
  "Tabs",
  "Added",
  "In order to",
  "Showcase overflow",
  "Menu",
  "On",
  "Larger",
  "Screens",
];

export const Bordered = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext appearance="bordered">
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
        {tabs.map((label) => (
          <TabNextPanel value={label} key={label}>
            {label}
          </TabNextPanel>
        ))}
      </TabsNext>
    </div>
  );
};

export const Inline = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabListNext appearance="transparent">
          {tabs.map((label) => (
            <TabNext value={label} key={label}>
              <TabNextTrigger>{label}</TabNextTrigger>
            </TabNext>
          ))}
        </TabListNext>

        {tabs.map((label) => (
          <TabNextPanel value={label} key={label}>
            {label}
          </TabNextPanel>
        ))}
      </TabsNext>
    </div>
  );
};

export const DragDropTabs = () => {
  const ts = useMemo(
    () =>
      new TabState(0, ["Home", "Transactions", "Loans", "Checks", "Liquidity"]),
    [],
  );

  const [{ activeTab, tabs }, setTabState] = useState<TabState>(ts);
  const handleChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setTabState((state) => state.setActiveTab(value));
    },
    [],
  );

  const handleMoveTab = useCallback(
    (fromIndex: number, toIndex: number) =>
      setTabState((state) => state.moveTab(fromIndex, toIndex)),
    [],
  );

  return (
    <div data-showcase-center>
      <TabsNext onChange={handleChange} value={activeTab}>
        <TabListNext appearance="transparent" onMoveTab={handleMoveTab}>
          {tabs.map((label, i) => (
            <TabNext value={label} key={label} data-index={i} draggable>
              <TabNextTrigger>{label}</TabNextTrigger>
            </TabNext>
          ))}
        </TabListNext>

        {tabs.map((label) => (
          <TabNextPanel value={label} key={label}>
            {label}
          </TabNextPanel>
        ))}
      </TabsNext>
    </div>
  );
};

const tabToIcon: Record<string, ComponentType> = {
  Home: HomeIcon,
  Transactions: ReceiptIcon,
  Loans: CreditCardIcon,
  Checks: BankCheckIcon,
  Liquidity: LineChartIcon,
};

export const WithIcon = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => {
              const Icon = tabToIcon[label];
              return (
                <TabNext
                  value={label}
                  key={label}
                  disabled={label === "Transactions"}
                >
                  <TabNextTrigger>
                    <Icon aria-hidden /> {label}
                  </TabNextTrigger>
                </TabNext>
              );
            })}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const WithBadge = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>
                  {label}
                  {label === "Transactions" ? (
                    <Badge value={2} aria-label="2 updates" />
                  ) : null}
                </TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const Overflow = () => {
  return (
    <TabsNext defaultValue={lotsOfTabs[0]}>
      <TabBar inset divider>
        <TabListNext style={{ maxWidth: 350, margin: "auto" }}>
          {lotsOfTabs.map((label) => (
            <TabNext value={label} key={label}>
              <TabNextTrigger>{label}</TabNextTrigger>
            </TabNext>
          ))}
        </TabListNext>
      </TabBar>
    </TabsNext>
  );
};

export const Closable = () => {
  const [tabs, setTabs] = useState([
    "Home",
    "Transactions",
    "Loans",
    "Checks",
    "Liquidity",
  ]);

  const { announce } = useAriaAnnouncer();

  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
                {tabs.length > 1 ? (
                  <TabNextAction
                    onClick={() => {
                      setTabs((old) => old.filter((tab) => tab !== label));
                      announce(`${label} tab has been closed`);
                    }}
                    aria-label="Close tab"
                  >
                    <CloseIcon aria-hidden />
                  </TabNextAction>
                ) : null}
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const DisabledTabs = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext appearance="bordered">
            {tabs.map((label) => (
              <TabNext disabled={label === "Loans"} value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
        {tabs.map((label) => (
          <TabNextPanel value={label} key={label}>
            {label}
          </TabNextPanel>
        ))}
      </TabsNext>
    </div>
  );
};

export const AddTabs = () => {
  const [tabs, setTabs] = useState(["Home", "Transactions", "Loans"]);
  const [value, setValue] = useState("Home");
  const newCount = useRef(0);

  const { announce } = useAriaAnnouncer();

  return (
    <div data-showcase-center>
      <TabsNext
        value={value}
        onChange={(_event, newValue) => setValue(newValue)}
      >
        <TabBar inset divider style={{ width: 500 }}>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
          <Button
            aria-label="Add tab"
            appearance="transparent"
            onClick={() => {
              const newTab = `New tab${newCount.current > 0 ? ` ${newCount.current}` : ""}`;
              newCount.current += 1;

              setTabs((old) => old.concat(newTab));
              announce(`${newTab} tab added`);
            }}
          >
            <AddIcon aria-hidden />
          </Button>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const Backgrounds = (): ReactElement => {
  const [variant, setVariant] =
    useState<TabListNextProps["activeColor"]>("primary");

  const handleVariantChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVariant(event.target.value as TabListNextProps["activeColor"]);
  };

  return (
    <StackLayout gap={6}>
      <div style={{ alignItems: "center", width: "40vw" }}>
        <TabsNext defaultValue={tabs[0]}>
          <TabBar divider>
            <TabListNext activeColor={variant} appearance="bordered">
              {tabs.map((label) => (
                <TabNext value={label} key={label}>
                  <TabNextTrigger>{label}</TabNextTrigger>
                </TabNext>
              ))}
            </TabListNext>
          </TabBar>
          {tabs.map((label) => (
            <TabNextPanel value={label} key={label} style={{ height: 200 }}>
              <Panel variant={variant}>{label}</Panel>
            </TabNextPanel>
          ))}
        </TabsNext>
      </div>
      <FormField style={{ width: "auto" }}>
        <FormFieldLabel>Select tabstrip color</FormFieldLabel>
        <RadioButtonGroup
          direction="horizontal"
          value={variant}
          onChange={handleVariantChange}
        >
          <RadioButton label="Primary" value="primary" />
          <RadioButton label="Secondary" value="secondary" />
          <RadioButton label="Tertiary" value="tertiary" />
        </RadioButtonGroup>
      </FormField>
    </StackLayout>
  );
};

function AddTabDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Dialog open={open}>
      <DialogHeader header="Add new tab" />
      <DialogContent>
        <FormField>
          <FormFieldLabel>New tab name</FormFieldLabel>
          <Input
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setValue(event.target.value);
            }}
          />
        </FormField>
      </DialogContent>
      <DialogActions>
        <Button appearance="solid" sentiment="negative" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={value.trim() === ""}
          appearance="solid"
          sentiment="accented"
          onClick={() => {
            onConfirm(value);
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const AddWithDialog = () => {
  const [tabs, setTabs] = useState(["Home", "Transactions", "Loans"]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const { announce } = useAriaAnnouncer();

  const handleConfirm = (newTab: string) => {
    setTabs((old) => old.concat(newTab));
    setConfirmationOpen(false);
    announce(`${newTab} tab added`);
  };

  const handleCancel = () => {
    setConfirmationOpen(false);
  };

  return (
    <div data-showcase-center>
      <AddTabDialog
        open={confirmationOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <TabsNext defaultValue="Home">
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
          <Button
            appearance="transparent"
            aria-label="Add tab"
            onClick={() => {
              setConfirmationOpen(true);
            }}
          >
            <AddIcon aria-hidden />
          </Button>
        </TabBar>
      </TabsNext>
    </div>
  );
};

function CloseConfirmationDialog({
  open,
  onConfirm,
  onCancel,
  onTransitionEnd,
  valueToRemove,
}: {
  open?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onTransitionEnd: () => void;
  valueToRemove?: string;
}) {
  return (
    <Dialog open={open} onTransitionEnd={onTransitionEnd}>
      <DialogHeader header={`Remove ${valueToRemove}?`} />
      <DialogActions>
        <Button appearance="bordered" sentiment="accented" onClick={onCancel}>
          No
        </Button>
        <Button appearance="solid" sentiment="accented" onClick={onConfirm}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const CloseWithConfirmation = () => {
  const [tabs, setTabs] = useState(["Home", "Transactions", "Loans"]);
  const [valueToRemove, setValueToRemove] = useState<string | undefined>(
    undefined,
  );
  const [open, setOpen] = useState(false);

  const { announce } = useAriaAnnouncer();

  const handleConfirm = () => {
    setTabs((old) => old.filter((tab) => tab !== valueToRemove));
    setOpen(false);
    announce(`${valueToRemove} tab has been removed`);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const clearValue = () => {
    setValueToRemove(undefined);
  };

  return (
    <div data-showcase-center>
      <CloseConfirmationDialog
        open={open}
        onCancel={handleCancel}
        valueToRemove={valueToRemove}
        onConfirm={handleConfirm}
        onTransitionEnd={clearValue}
      />
      <TabsNext defaultValue="Home">
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
                {tabs.length > 1 ? (
                  <TabNextAction
                    onClick={() => {
                      setOpen(true);
                      setValueToRemove(label);
                    }}
                    aria-label="Close tab"
                  >
                    <CloseIcon aria-hidden />
                  </TabNextAction>
                ) : null}
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const WithInteractiveElementInPanel = () => {
  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar>
          <TabListNext appearance="transparent">
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>

        {tabs.map((label) => (
          <TabNextPanel value={label} key={label}>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
              sed elit in sem gravida aliquet id non justo. In hac habitasse
              platea dictumst. Morbi non dui vehicula risus feugiat egestas eget
              ac mi. Nullam accumsan aliquam orci, ornare pharetra nulla gravida
              sed. Sed lobortis ut neque at volutpat. Nunc non suscipit purus,
              id facilisis dolor. Class aptent taciti sociosqu ad litora
              torquent per conubia nostra, per inceptos himenaeos. Nullam
              pretium imperdiet massa, vitae suscipit sem laoreet quis. Maecenas
              mattis lacus tincidunt odio rhoncus tincidunt.
            </Text>
            <Link href="#">Link</Link>
          </TabNextPanel>
        ))}
      </TabsNext>
    </div>
  );
};

export const WithMenu = () => {
  const [tabs, setTabs] = useState([
    "Home",
    "Transactions",
    "Loans",
    "Checks",
    "Liquidity",
  ]);

  const [pinned, setPinned] = useState<string[]>([]);

  return (
    <div data-showcase-center>
      <TabsNext defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabListNext>
            {tabs.map((label) => (
              <TabNext value={label} key={label}>
                <TabNextTrigger>
                  {pinned.includes(label) ? (
                    <FavoriteIcon aria-label="Pinned" />
                  ) : undefined}
                  {label}
                </TabNextTrigger>
                {tabs.length > 1 ? (
                  <Menu>
                    <MenuTrigger>
                      <TabNextAction aria-label="Settings">
                        <MicroMenuIcon aria-hidden />
                      </TabNextAction>
                    </MenuTrigger>
                    <MenuPanel>
                      <MenuItem
                        onClick={() => {
                          setPinned((old) => {
                            if (old.includes(label)) {
                              return old.filter((pin) => pin !== label);
                            }
                            return old.concat(label);
                          });
                        }}
                      >
                        {pinned.includes(label) ? "Unpin" : "Pin"}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setTabs((old) => old.filter((tab) => tab !== label));
                        }}
                      >
                        Delete
                      </MenuItem>
                    </MenuPanel>
                  </Menu>
                ) : null}
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </div>
  );
};

export const Controlled = () => {
  const [tabs, setTabs] = useState(lotsOfTabs);
  const [value, setValue] = useState("Home");

  const handleChange = (_: SyntheticEvent | null, value: string) => {
    console.log(value);
    setValue(value);
  };

  return (
    <TabsNext value={value} onChange={handleChange} data-showcase-center>
      <TabBar inset divider>
        <TabListNext style={{ maxWidth: 350, margin: "auto" }}>
          {tabs.map((label) => (
            <TabNext value={label} key={label}>
              <TabNextTrigger>{label}</TabNextTrigger>
              {tabs.length > 1 ? (
                <TabNextAction
                  onClick={() => {
                    setTabs((old) => old.filter((tab) => tab !== label));
                  }}
                  aria-label="Close tab"
                >
                  <CloseIcon aria-hidden />
                </TabNextAction>
              ) : null}
            </TabNext>
          ))}
        </TabListNext>
      </TabBar>
    </TabsNext>
  );
};
