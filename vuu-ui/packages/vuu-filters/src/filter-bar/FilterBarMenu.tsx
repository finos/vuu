import { PopupMenu } from "@vuu-ui/vuu-popups";

export const FilterBarMenu = () => {
  const classBase = "vuuFilterBarMenu";
  return (
    <div className={classBase}>
      <PopupMenu icon="tune" menuLocation="filter-bar-menu" tabIndex={-1} />
    </div>
  );
};
