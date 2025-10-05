import {
  TabsNext,
  TabListNext,
  TabNext,
  TabNextPanel,
  TabNextTrigger,
} from "@salt-ds/lab";
import { Button } from "@salt-ds/core";
import {
  FilterProvider,
  SavedFilterPanel,
  SaveFilterConfirmPrompt,
  useSavedFilters,
} from "@vuu-ui/vuu-filters";
import { ReactElement, useCallback, useRef, useState } from "react";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import { Filter } from "@vuu-ui/vuu-filter-types";

const DummyFilterPanel = () => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const filterRef = useRef<Filter | undefined>(undefined);
  const [dialog, setDialog] = useState<ReactElement | null>(null);
  const { saveFilter } = useSavedFilters();

  const handleConfirm = useCallback(
    (name: string) => {
      if (filterRef.current) {
        setDialog(null);
        saveFilter(name);
      }
    },
    [saveFilter],
  );

  const handleSave = useCallback(() => {
    const filterString = textRef.current?.value;
    if (filterString) {
      filterRef.current = parseFilter(filterString);
      setDialog(
        <SaveFilterConfirmPrompt
          onConfirm={handleConfirm}
          onClose={() => setDialog(null)}
          title="Save filter"
        />,
      );
    }
  }, [handleConfirm]);

  return (
    <>
      <style>{`
            .FilterPanel {
                display: flex;
                flex-direction: column;
            }
            .FilterPanel-filter {
                flex : auto 1 1;
                position: relative;
                textarea {
                    position: absolute;
                    inset:0;
                }
            }
            .FilterPanel-actions {
                align-items: center;
                display: flex;
                flex: 0 0 40px;
                justify-content:space-between;
            }
        `}</style>
      <div className="FilterPanel">
        <div className="FilterPanel-filter">
          <textarea defaultValue='currency = "USD"' ref={textRef} />
        </div>
        <div className="FilterPanel-actions">
          <Button onClick={handleSave}>Save</Button>
          <Button>Clear All</Button>
        </div>
      </div>
      {dialog}
    </>
  );
};

export const TabbedFilterContainer = () => {
  return (
    <>
      <style>{`
        .TabbedFilterContainer {
            background: rgb(21,39,59);
            color: white;
            height: 100%;
            padding: 0 var(--salt-spacing-400);
            width: 330px;
            .saltTabsNext {
                height: 100%;
            }
            .saltTabListNext {
            }
            .saltTabNext {
                --saltTabListNext-activeColor: red;
                flex-basis:0;
                flex-grow:1;
                font-size: 16px;
                height: 50px;
                
            }
            .saltTabNextPanel {
                height: calc(100% - 50px);
                .FilterPanel, .vuuSavedFilterPanel {
                    height: 100%;
                }
            }
        }
    `}</style>
      <div className="TabbedFilterContainer">
        <FilterProvider>
          <TabsNext defaultValue="ad-hoc-filter">
            <TabListNext appearance="transparent">
              <TabNext value="ad-hoc-filter" key="ad-hoc-filter">
                <TabNextTrigger>AD HOC</TabNextTrigger>
              </TabNext>
              <TabNext value="saved-filters" key="saved-filters">
                <TabNextTrigger>SAVED</TabNextTrigger>
              </TabNext>
            </TabListNext>

            <TabNextPanel value="ad-hoc-filter" key="ad-hoc-filter">
              <DummyFilterPanel />
            </TabNextPanel>
            <TabNextPanel value="saved-filters" key="saved-filters">
              <SavedFilterPanel />
            </TabNextPanel>
          </TabsNext>
        </FilterProvider>
      </div>
    </>
  );
};
