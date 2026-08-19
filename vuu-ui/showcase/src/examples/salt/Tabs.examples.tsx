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
  Tabs,
  TabBar,
  TabList,
  Tab,
  TabTrigger,
  TabPanel,
  TabListProps,
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
import { ChangeEvent, SyntheticEvent, useRef, useState } from "react";
import { ReactComponent } from "@vuu-ui/vuu-utils";

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
    <div className="container">
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList appearance="bordered">
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
        </TabBar>
        {tabs.map((label) => (
          <TabPanel value={label} key={label}>
            {label}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export const Inline = () => {
  return (
    <div className="container">
      <Tabs defaultValue={tabs[0]}>
        <TabList appearance="transparent">
          {tabs.map((label) => (
            <Tab value={label} key={label}>
              <TabTrigger>{label}</TabTrigger>
            </Tab>
          ))}
        </TabList>

        {tabs.map((label) => (
          <TabPanel value={label} key={label}>
            {label}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

const tabToIcon: Record<string, any> = {
  Home: HomeIcon,
  Transactions: ReceiptIcon,
  Loans: CreditCardIcon,
  Checks: BankCheckIcon,
  Liquidity: LineChartIcon,
};

export const WithIcon = () => {
  return (
    <div className="container">
      <style>{`.saltIcon { display: block !important; }`}</style>
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => {
              const Icon = tabToIcon[label];
              return (
                <Tab
                  value={label}
                  key={label}
                  disabled={label === "Transactions"}
                >
                  <TabTrigger>
                    <Icon aria-hidden /> {label}
                  </TabTrigger>
                </Tab>
              );
            })}
          </TabList>
        </TabBar>
      </Tabs>
    </div>
  );
};

export const WithBadge = () => {
  return (
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>
                  {label}
                  {label === "Transactions" ? (
                    <Badge value={2} aria-label="2 updates" />
                  ) : null}
                </TabTrigger>
              </Tab>
            ))}
          </TabList>
        </TabBar>
      </Tabs>
    </div>
  );
};

export const Overflow = () => {
  return (
    <Tabs defaultValue={lotsOfTabs[0]}>
      <TabBar inset divider>
        <TabList style={{ margin: "auto", maxWidth: 360 }}>
          {lotsOfTabs.map((label) => (
            <Tab value={label} key={label}>
              <TabTrigger>{label}</TabTrigger>
            </Tab>
          ))}
        </TabList>
      </TabBar>
    </Tabs>
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
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <style>{`.saltIcon { display: block !important; }`}</style>
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
                {tabs.length > 1 ? (
                  <Button
                    onClick={() => {
                      setTabs((old) => old.filter((tab) => tab !== label));
                      announce(`${label} tab has been closed`, 150);
                    }}
                    aria-label="Close tab"
                  >
                    <CloseIcon aria-hidden />
                  </Button>
                ) : null}
              </Tab>
            ))}
          </TabList>
        </TabBar>
      </Tabs>
    </div>
  );
};

export const DisabledTabs = () => {
  return (
    <div className="container">
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList appearance="bordered">
            {tabs.map((label) => (
              <Tab disabled={label === "Loans"} value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
        </TabBar>
        {tabs.map((label) => (
          <TabPanel value={label} key={label}>
            {label}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export const AddTabs = () => {
  const [tabs, setTabs] = useState(["Home", "Transactions", "Loans"]);
  const [value, setValue] = useState("Home");
  const newCount = useRef(0);

  const { announce } = useAriaAnnouncer();

  return (
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <style>{`.saltIcon { display: block !important; }`}</style>
      <Tabs
        defaultValue={tabs[0]}
        value={value}
        onChange={(_event, newValue) => setValue(newValue)}
      >
        <TabBar inset divider style={{ width: 500 }}>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
          <Button
            aria-label="Add tab"
            appearance="transparent"
            onClick={() => {
              const newTab = `New tab${newCount.current > 0 ? ` ${newCount.current}` : ""}`;
              newCount.current += 1;

              setTabs((old) => old.concat(newTab));
              announce(`${newTab} tab added`, 150);
            }}
          >
            <AddIcon aria-hidden />
          </Button>
        </TabBar>
      </Tabs>
    </div>
  );
};

export const Backgrounds = () => {
  const [variant, setVariant] =
    useState<TabListProps["activeColor"]>("primary");

  const handleVariantChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVariant(event.target.value as TabListProps["activeColor"]);
  };

  return (
    <StackLayout gap={6}>
      <div style={{ alignItems: "center", width: "40vw" }}>
        <Tabs defaultValue={tabs[0]}>
          <TabBar divider>
            <TabList activeColor={variant} appearance="bordered">
              {tabs.map((label) => (
                <Tab value={label} key={label}>
                  <TabTrigger>{label}</TabTrigger>
                </Tab>
              ))}
            </TabList>
          </TabBar>
          {tabs.map((label) => (
            <TabPanel value={label} key={label} style={{ height: 200 }}>
              <Panel variant={variant}>{label}</Panel>
            </TabPanel>
          ))}
        </Tabs>
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
    announce(`${newTab} tab added`, 150);
  };

  const handleCancel = () => {
    setConfirmationOpen(false);
  };

  return (
    <div className="container">
      <AddTabDialog
        open={confirmationOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Tabs defaultValue="Home">
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
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
      </Tabs>
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
    announce(`${valueToRemove} tab has been removed`, 150);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const clearValue = () => {
    setValueToRemove(undefined);
  };

  return (
    <div className="container">
      <CloseConfirmationDialog
        open={open}
        onCancel={handleCancel}
        valueToRemove={valueToRemove}
        onConfirm={handleConfirm}
        onTransitionEnd={clearValue}
      />
      <Tabs defaultValue="Home">
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
                {tabs.length > 1 ? (
                  <Button
                    onClick={() => {
                      setOpen(true);
                      setValueToRemove(label);
                    }}
                    aria-label="Close tab"
                  >
                    <CloseIcon aria-hidden />
                  </Button>
                ) : null}
              </Tab>
            ))}
          </TabList>
        </TabBar>
      </Tabs>
    </div>
  );
};

export const WithInteractiveElementInPanel = () => {
  return (
    <div className="container">
      <Tabs defaultValue={tabs[0]}>
        <TabBar>
          <TabList appearance="transparent">
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>{label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
        </TabBar>

        {tabs.map((label) => (
          <TabPanel value={label} key={label}>
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
          </TabPanel>
        ))}
      </Tabs>
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
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <Tabs defaultValue={tabs[0]}>
        <TabBar inset divider>
          <TabList>
            {tabs.map((label) => (
              <Tab value={label} key={label}>
                <TabTrigger>
                  {pinned.includes(label) ? (
                    <FavoriteIcon aria-label="Pinned" />
                  ) : undefined}
                  {label}
                </TabTrigger>
                {tabs.length > 1 ? (
                  <Menu>
                    <MenuTrigger>
                      <Button aria-label="Settings">
                        <MicroMenuIcon aria-hidden />
                      </Button>
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
              </Tab>
            ))}
          </TabList>
        </TabBar>
      </Tabs>
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
    <Tabs value={value} onChange={handleChange}>
      <TabBar inset divider>
        <TabList style={{ maxWidth: 350, margin: "auto" }}>
          {tabs.map((label) => (
            <Tab value={label} key={label}>
              <TabTrigger>{label}</TabTrigger>
              {tabs.length > 1 ? (
                <Button
                  onClick={() => {
                    setTabs((old) => old.filter((tab) => tab !== label));
                  }}
                  aria-label="Close tab"
                >
                  <CloseIcon aria-hidden />
                </Button>
              ) : null}
            </Tab>
          ))}
        </TabList>
      </TabBar>
    </Tabs>
  );
};
