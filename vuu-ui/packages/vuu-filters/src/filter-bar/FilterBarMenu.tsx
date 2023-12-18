import { PopupMenu } from "@finos/vuu-popups";
import { useFilterBarMenu } from "./useFilterBarMenu";

export const FilterBarMenu = () => {
  const classBase = "vuuFilterBarMenu";

  const { menuBuilder, menuActionHandler } = useFilterBarMenu();

  return (
    <div className={classBase}>
      <PopupMenu
        icon="tune"
        menuBuilder={menuBuilder}
        menuActionHandler={menuActionHandler}
        tabIndex={-1}
      />
    </div>
  );
};
