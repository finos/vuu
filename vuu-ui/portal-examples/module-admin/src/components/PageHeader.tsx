import { Button, Text } from "@salt-ds/core";
import { AddIcon, RefreshIcon } from "@salt-ds/icons";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useModuleAdmin } from "../ModuleAdminContext";

const classBase = "vuuModuleAdmin";

export const PageHeader = ({
  children,
  description,
  title,
}: {
  children?: ReactNode;
  description: ReactNode;
  title: string;
}) => (
  <div className={`${classBase}-pageHeader`}>
    <div className={`${classBase}-pageTitles`}>
      <h1 className={`${classBase}-title`}>{title}</h1>
      <Text color="secondary">{description}</Text>
    </div>
    {children ? (
      <div className={`${classBase}-pageActions`}>{children}</div>
    ) : null}
  </div>
);

/** Check all remotes and New module, shown on the Overview and Modules pages. */
export const ModuleCommands = () => {
  const { checkAll, modules, paths } = useModuleAdmin();
  const navigate = useNavigate();
  return (
    <>
      <Button
        appearance="bordered"
        disabled={modules.length === 0}
        onClick={checkAll}
      >
        <RefreshIcon aria-hidden /> Check all remotes
      </Button>
      <Button onClick={() => navigate(paths.newModule())} sentiment="accented">
        <AddIcon aria-hidden /> New module
      </Button>
    </>
  );
};
