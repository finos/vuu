import {
  Accordion,
  AccordionGroup,
  AccordionHeader,
  AccordionPanel,
} from "@salt-ds/core";
import { Panel } from "@salt-ds/core";

let displaySequence = 1;

export const DefaultAccordion = () => {
  return (
    <Panel style={{ width: 600, height: 800 }}>
      <AccordionGroup>
        <Accordion className={"accordion"} value={"mountains-and-hills"} id="1">
          <AccordionHeader>Mountains and hills</AccordionHeader>
          <AccordionPanel>
            <Panel>
              <p>Scotland: Ben Nevis, 1,345 metres</p>
              <p>Wales: Snowdon (Snowdonia), 1,085 metres</p>
              <p>England: Scafell Pike (Cumbrian Mountains), 978 metres</p>
              <p>
                Northern Ireland: Slieve Donard (Mourne Mountains), 852 metres
              </p>
            </Panel>
          </AccordionPanel>
        </Accordion>
        <Accordion className={"accordion"} value={"rivers-and-lakes"} id="2">
          <AccordionHeader>Rivers and lakes</AccordionHeader>
          <AccordionPanel>
            <Panel>
              <p>England: River Thames (215 mi; 346 km)</p>
              <p>Scotland: River Tay (117 mi; 188 km)</p>
              <p>N. Ireland: River Bann (76 mi; 122 km)</p>
              <p>Wales: River Tywi (64 mi; 103 km)</p>
            </Panel>
          </AccordionPanel>
        </Accordion>
        <Accordion className={"accordion"} value={"islands"} id="3">
          <AccordionHeader>Islands</AccordionHeader>
          <AccordionPanel>
            <Panel>
              <p>Barrow Island</p>
              <p>Bawden Rocks</p>
              <p>Brownsea Island</p>
              <p>Canvey Island</p>
              <p>Coquet Island</p>
              <p>Drake`&quot;`s Island</p>
            </Panel>
          </AccordionPanel>
        </Accordion>
      </AccordionGroup>
    </Panel>
  );
};
DefaultAccordion.displaySequence = displaySequence++;
