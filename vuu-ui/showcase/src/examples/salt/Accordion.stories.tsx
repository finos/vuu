import {
  Accordion,
  AccordionDetails,
  AccordionSection,
  AccordionSummary,
  Panel
} from "@heswell/salt-lab";

export const DefaultAccordion = () => {
  return (
    <Panel style={{ width: 600, height: 800 }}>
      <Accordion defaultExpandedSectionIds={["1"]}>
        <AccordionSection
          className={"accordion"}
          key={"mountains-and-hills"}
          id="1"
        >
          <AccordionSummary>Mountains and hills</AccordionSummary>
          <AccordionDetails>
            <Panel>
              <p>Scotland: Ben Nevis, 1,345 metres</p>
              <p>Wales: Snowdon (Snowdonia), 1,085 metres</p>
              <p>England: Scafell Pike (Cumbrian Mountains), 978 metres</p>
              <p>
                Northern Ireland: Slieve Donard (Mourne Mountains), 852 metres
              </p>
            </Panel>
          </AccordionDetails>
        </AccordionSection>
        <AccordionSection
          className={"accordion"}
          key={"rivers-and-lakes"}
          id="2"
        >
          <AccordionSummary>Rivers and lakes</AccordionSummary>
          <AccordionDetails>
            <Panel>
              <p>England: River Thames (215 mi; 346 km)</p>
              <p>Scotland: River Tay (117 mi; 188 km)</p>
              <p>N. Ireland: River Bann (76 mi; 122 km)</p>
              <p>Wales: River Tywi (64 mi; 103 km)</p>
            </Panel>
          </AccordionDetails>
        </AccordionSection>
        <AccordionSection className={"accordion"} key={"islands"} id="3">
          <AccordionSummary>Islands</AccordionSummary>
          <AccordionDetails>
            <Panel>
              <p>Barrow Island</p>
              <p>Bawden Rocks</p>
              <p>Brownsea Island</p>
              <p>Canvey Island</p>
              <p>Coquet Island</p>
              <p>Drake`&quot;`s Island</p>
            </Panel>
          </AccordionDetails>
        </AccordionSection>
      </Accordion>
    </Panel>
  );
};
