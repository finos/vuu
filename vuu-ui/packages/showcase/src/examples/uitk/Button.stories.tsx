
// import { ComponentAnatomy } from '@heswell/component-anatomy';
import { Button } from '@heswell/uitk-core';
// import { Button } from '@vuu-ui/ui-controls';
import '@vuu-ui/theme';

import '@heswell/component-anatomy/esm/index.css';

export const DefaultButton = () => {
  const handleClick = (e) => {
    console.log('Button click');
  };
  return <Button onClick={handleClick}>Button</Button>;
};

// export const DefaultStateButton = () => {
//   const handleChange = (e, value) => {
//     console.log(`Button click, new state = ${value}`);
//   };
//   return (
//     <StateButton defaultChecked={false} onChange={handleChange}>
//       Button
//     </StateButton>
//   );
// };

// export const WithRenderVisualiser = () => {
//   const handleChange = (e, value) => {
//     console.log(`Button click, new state = ${value}`);
//   };
//   return (
//     <ComponentAnatomy>
//       <StateButton defaultChecked={false} onChange={handleChange}>
//         Button
//       </StateButton>
//     </ComponentAnatomy>
//   );
// };

export const IconButtons = () => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button data-icon="filter" />
      <Button data-icon="filter">Filter</Button>
    </div>
  );
};
