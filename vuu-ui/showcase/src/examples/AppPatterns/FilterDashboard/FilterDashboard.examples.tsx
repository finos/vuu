import {
  Button,
  Checkbox,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import { DatePicker } from "@salt-ds/lab";

import "./FilterDashboard.css";

type SummaryLineDescriptor = {
  clientCount: number;
  tradeCount: number;
  filter: string;
  group: string;
  label: string;
};

const summaryLines: SummaryLineDescriptor[] = [
  {
    clientCount: 40,
    tradeCount: 200,
    filter: "",
    group: "Booking Status",
    label: "Unbooked Trades",
  },
  {
    clientCount: 85,
    tradeCount: 200,
    filter: "",
    group: "Booking Status",
    label: "Partially booked Trades",
  },
  {
    clientCount: 100,
    tradeCount: 200,
    filter: "",
    group: "Fill Status",
    label: "Unfilled Trades",
  },
  {
    clientCount: 200,
    tradeCount: 200,
    filter: "",
    group: "Fill Status",
    label: "Partially filled Trades",
  },
  {
    clientCount: 25,
    tradeCount: 200,
    filter: "",
    group: "FX Status",
    label: "Trades require FX coverage",
  },
];

type QueryControlDescriptor = {
  helperText: string;
  filter: string;
  group: string;
  label: string;
  placeholder?: string;
  type?: "date" | "settlement" | "text";
};
const queryControls: QueryControlDescriptor[] = [
  {
    filter: "",
    group: "Client",
    label: "ClientId",
    helperText:
      "Search for match on Client ID, Client Name, Client Description ",
    placeholder: "Search Client",
  },
  {
    filter: "",
    group: "Instrument",
    label: "Instrument Name",
    helperText: "Search for instrument on Instrument Name, RIC, ISIN",
    placeholder: "Search Instrument",
  },
  { filter: "", group: "Date", label: "Trade Date", helperText: "" , type: "date"},
  { filter: "", group: "Date", label: "Settlement Date", helperText: "" , type: "settlement"},
  {
    filter: "",
    group: "Other",
    label: "Currency",
    helperText: "",
  },
  {
    filter: "",
    group: "Other",
    label: "Country",
    helperText: "",
  },
];

const FilterDashboard = () => {
  const groupedSummaryLines = Object.groupBy(
    summaryLines,
    (item, idx) => item.group
  );

  console.log(groupedSummaryLines);

  return (
    <div className="FilterDashboard">
      {Object.entries(groupedSummaryLines).map(([groupLabel, lines], idx) => (
        <div className="FilterDashboard-group" key={idx}>
          <div className="FilterDashboard-title">{groupLabel}</div>
          {lines?.map(({ clientCount, tradeCount, label }, i) => (
            <div className="FilterDashboard-entry" key={i}>
              <Checkbox checked={true} />
              <span>{tradeCount}</span>
              <span>{label}</span>
              <span className="FilterDashboard-clientCount">{`${clientCount} clients`}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const getFormControl = (type: "date" | "text", placeholder?: string) => {
  switch(type){
    case "date": return (
        <DatePicker selectionVariant="range"/>
    );
    case "settlement": return (
      <div className="vuuDatePicker">
        <Button className="vuuDateButton" variant="secondary">T</Button>
        <Button className="vuuDateButton" variant="secondary">T1</Button>
        <Button className="vuuDateButton" variant="secondary">T2</Button>
        <DatePicker selectionVariant="range"/>
      </div>
    );
    default: return <Input placeholder={placeholder} />
  }
}

const FilterQuery = () => {
  const groupedSummaryLines = Object.groupBy(
    queryControls,
    (item) => item.group
  );

  console.log(groupedSummaryLines);

  return (
    <div className="QueryPanel">
      {Object.entries(groupedSummaryLines).map(([groupLabel, lines], idx) => (
        <div className="QueryPanel-group" key={idx}>
          <div className="FilterDashboard-title">{groupLabel}</div>
          <div className={`QueryPanel-controls QueryPanel-controls-${groupLabel}`}>
            {lines?.map(({ label, helperText, placeholder, type="text" }, i) => (
              <div className="QueryPanel-entry" key={i}>
                <FormField>
                  <FormFieldLabel>{label}</FormFieldLabel>
                  {
                    getFormControl(type, placeholder) 
                  }
                  <FormFieldHelperText>{helperText}</FormFieldHelperText>
                </FormField>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const TradeManagement = () => {
  return (
    <div className="TradeManagement">
      <FilterDashboard />
      <div className="TradeManagement-buttons">
        <Button variant="cta">Load Trades</Button>
      </div>
      <FilterQuery />
      <div className="TradeManagement-buttons">
        <Button variant="cta">Load Trades</Button>
      </div>
    </div>
  );
};


