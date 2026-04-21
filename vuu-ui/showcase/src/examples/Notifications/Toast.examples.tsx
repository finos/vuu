import { ChangeEvent, useState } from "react";
import {
  NotificationsProvider,
  useNotifications,
  ToastNotification,
  NotificationAnimationType,
} from "@vuu-ui/vuu-notifications";
import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
  Switch,
  ValidationStatus,
} from "@salt-ds/core";

// this example allows to fire notifications dynamically when wrapped in NotificationsProvider
const Notifications = () => {
  const [type, setType] = useState<ValidationStatus>("info");
  const [animationType, setAnimationType] = useState<
    NotificationAnimationType | undefined
  >(undefined);
  const [header, setHeader] = useState<string>("Header");
  const [body, setBody] = useState<string>("Body");
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [icon, setIcon] = useState(true);

  const { showNotification } = useNotifications();

  const handleNotification = () => {
    showNotification({
      animationType,
      content: body,
      header,
      icon,
      showCloseButton,
      status: type,
      type: "toast",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 300,
        margin: 20,
      }}
    >
      <FormField>
        <FormFieldLabel>Toast status Type</FormFieldLabel>
        <Dropdown<ValidationStatus>
          bordered
          selected={[type]}
          onSelectionChange={(_, [selectedItem]) => {
            if (selectedItem) {
              setType(selectedItem);
            }
          }}
        >
          <Option value="error">Error</Option>
          <Option value="info">Info</Option>
          <Option value="success">Success</Option>
          <Option value="warning">Warning</Option>
        </Dropdown>
      </FormField>
      <FormField>
        <FormFieldLabel>Animation Style</FormFieldLabel>
        <Dropdown<NotificationAnimationType | "none">
          bordered
          selected={[animationType ?? "none"]}
          onSelectionChange={(_, [selectedItem]) => {
            if (selectedItem) {
              setAnimationType(
                selectedItem === "none" ? undefined : selectedItem,
              );
            }
          }}
        >
          <Option value="slide-in">Slide In</Option>
          <Option value="slide-out">Slide Out</Option>
          <Option value="slide-in,slide-out">Slide in / slide out</Option>
          <Option value="none">None</Option>
        </Dropdown>
      </FormField>
      <FormField>
        <FormFieldLabel>Notification Header</FormFieldLabel>
        <Input
          bordered
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setHeader(event.target.value)
          }
          value={header}
        />
      </FormField>
      <FormField>
        <FormFieldLabel>Notification Body</FormFieldLabel>
        <Input
          bordered
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBody(event.target.value)
          }
          value={body}
        />
      </FormField>
      <FormField>
        <FormFieldLabel>Close Button</FormFieldLabel>
        <Switch
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setShowCloseButton(event.target.checked)
          }
          checked={showCloseButton}
        />
      </FormField>
      <FormField>
        <FormFieldLabel>Include Icon</FormFieldLabel>
        <Switch
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setIcon(event.target.checked)
          }
          checked={icon}
        />
      </FormField>
      <button onClick={handleNotification}>trigger notifications</button>
    </div>
  );
};

export const NotificationsWithContext = () => (
  <NotificationsProvider>
    <Notifications />
  </NotificationsProvider>
);

export const SuccessNotificationToast = () => (
  <>
    <ToastNotification
      top={20}
      animated={false}
      notification={{
        header: "Header and Icon notification",
        status: "success",
        type: "toast",
      }}
    />

    <ToastNotification
      top={100}
      animated={false}
      notification={{
        content: "Header, Content and Icon",
        header: "Layout Saved Successfully",
        status: "success",
        type: "toast",
      }}
    />

    <ToastNotification
      top={200}
      animated={false}
      notification={{
        icon: false,
        header: "Header only",
        status: "success",
        type: "toast",
      }}
    />

    <ToastNotification
      top={300}
      animated={false}
      notification={{
        content: "Header and Content without Icon",
        icon: false,
        header: "Layout Saved Successfully",
        status: "success",
        type: "toast",
      }}
    />

    <ToastNotification
      top={400}
      animated={false}
      notification={{
        content: "Header and Content without Icon",
        icon: false,
        header:
          "This notification has a very long header, so long that it exceeds the minimum toast width",
        status: "success",
        type: "toast",
      }}
    />
  </>
);

export const ErrorNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This didn't work",
      header: "This Didn't Work",
      status: "error",
      type: "toast",
    }}
  />
);

export const WarningNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This probably won't work",
      header: "This probably won't work",
      status: "warning",
      type: "toast",
    }}
  />
);

export const InfoNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This is Info Body",
      header: "This is Info Title",
      status: "info",
      type: "toast",
    }}
  />
);

export const CustomCssOverride = () => (
  <>
    <style>{`
        .vuuToastNotification {
          --vuuToast-grid-template-areas:
          "toast-header toast-icon";
          --vuuToast-gridTemplateColumns: auto 36px;
        }
    `}</style>
    <ToastNotification
      top={20}
      animated={false}
      notification={{
        header: "This is Info Title",
        status: "success",
        type: "toast",
      }}
    />
  </>
);
