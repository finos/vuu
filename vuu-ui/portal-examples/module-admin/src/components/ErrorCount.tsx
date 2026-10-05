import { ErrorIcon } from "@salt-ds/icons";

export const ErrorCount = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="vuuModuleAdmin-errorCount">
      <ErrorIcon aria-hidden /> {count} {count === 1 ? "error" : "errors"}
    </span>
  ) : null;
