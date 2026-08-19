import { Prompt, type PromptProps } from "@vuu-ui/vuu-ui-controls";
import { ChangeEventHandler, CSSProperties, ReactNode, useCallback, useMemo, useRef } from "react";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";

const PromptTemplate = ({
  children,
  cancelButtonLabel,
  confirmButtonLabel,
  customAction,
  headerTag,
  icon,
  initialFocusedItem,
  onCancel,
  onConfirm,
  open = true,
  showCancelButton,
  showCloseButton,
  showConfirmButton,
  style,
  title = "Prompt Example",
}: Pick<
  PromptProps,
  | "confirmButtonLabel"
  | "cancelButtonLabel"
  | "customAction"
  | "headerTag"
  | "icon"
  | "initialFocusedItem"
  | "onConfirm"
  | "onCancel"
  | "open"
  | "showCancelButton"
  | "showCloseButton"
  | "showConfirmButton"
> & {
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}) => {
  return (
    <Prompt
      cancelButtonLabel={cancelButtonLabel}
      confirmButtonLabel={confirmButtonLabel}
      customAction={customAction}
      headerTag={headerTag}
      icon={icon}
      initialFocusedItem={initialFocusedItem}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      showCancelButton={showCancelButton}
      showCloseButton={showCloseButton}
      showConfirmButton={showConfirmButton}
      style={style}
      title={title}
    >
      {children}
    </Prompt>
  );
};

export const BareBonesPrompt = () => {
  return <PromptTemplate>This is Prompt text</PromptTemplate>;
};

export const WithIcon = () => {
  return <PromptTemplate icon="filter">This is Prompt text</PromptTemplate>;
};

export const WithHeaderTag = () => {
  return (
    <PromptTemplate
      headerTag={
        <div style={{ background: "red", padding: "0 6px" }}>Beta</div>
      }
    >
      This is Prompt text
    </PromptTemplate>
  );
};

export const WithIconAndHeaderTag = () => {
  return (
    <PromptTemplate
      headerTag={
        <div style={{ background: "red", padding: "0 6px" }}>Beta</div>
      }
      icon="filter"
    >
      This is Prompt text
    </PromptTemplate>
  );
};

export const FocusOnConfirm = () => {
  return (
    <PromptTemplate initialFocusedItem="confirm">
      This is Prompt text
    </PromptTemplate>
  );
};

export const WithCustomAction = () => {
  const customAction = useMemo(() => <span>Confirm to continue</span>, []);
  return (
    <PromptTemplate customAction={customAction} initialFocusedItem="confirm">
      This is Prompt text
    </PromptTemplate>
  );
};

export const WithContentStyling = () => {
  return (
    <>
      <style>{`
        .PromptText {
            padding: var(--salt-spacing-200);
        }
    `}</style>
      <PromptTemplate>
        <h3 className="PromptText">This is Prompt text</h3>
      </PromptTemplate>
    </>
  );
};

export const ReduceSize = () => {
  const style = {
    "--vuuPrompt-minHeight": "160px",
    "--vuuPrompt-minWidth": "200px",
  } as CSSProperties;
  return (
    <PromptTemplate confirmButtonLabel="OK" style={style}>
      This is Prompt text that will not wrap because minWidth has been
      specified, not width
    </PromptTemplate>
  );
};

export const ConfirmOnly = () => {
  const style = {
    "--vuuPrompt-minHeight": "160px",
    "--vuuPrompt-minWidth": "200px",
  } as CSSProperties;
  return (
    <PromptTemplate
      confirmButtonLabel="OK"
      showCancelButton={false}
      showCloseButton={false}
      style={style}
    >
      This is Prompt text that will not wrap because minWidth has been
      specified, not width
    </PromptTemplate>
  );
};

export const UserInputCapture = () => {
  const style = {
    "--vuuPrompt-minHeight": "160px",
    "--vuuPrompt-minWidth": "200px",
  } as CSSProperties;

  const firstName = useRef("");
  const lastName = useRef("");

  const onChangeFirstName = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
    firstName.current = (e.target as HTMLInputElement).value;
  }, []);
  const onChangeLastName = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
    lastName.current = (e.target as HTMLInputElement).value;
  }, []);

  const onConfirm = () => {
    console.log(`confirmed ${firstName.current} ${lastName.current}`);
  };

  return (
    <PromptTemplate
      confirmButtonLabel="Save"
      onConfirm={onConfirm}
      showCancelButton={false}
      showCloseButton={false}
      style={style}
    >
      <form>
        <FormField>
          <FormFieldLabel>First Name</FormFieldLabel>
          <Input onChange={onChangeFirstName} />
        </FormField>
        <FormField>
          <FormFieldLabel>Last Name</FormFieldLabel>
          <Input onChange={onChangeLastName} />
        </FormField>
      </form>
    </PromptTemplate>
  );
};
