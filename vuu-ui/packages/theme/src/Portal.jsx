import { useLayoutEffect, useMemo } from 'react';
import * as ReactDOM from 'react-dom';
import { createContainer, renderPortal } from './render-portal';

export const Portal = function Portal(props) {
  // Do we need to accept container here as a prop ?
  const { children, x, y } = props;
  let renderContainer = useMemo(() => {
    return createContainer();
  }, []);

  // console.log(`Portal render x ${x} y ${y}`);

  // useEffect(() => {
  //   console.log(`Portal mounted`);
  //   return () => {
  //     console.log('Portal unmounted');
  //   };
  // }, []);

  useLayoutEffect(() => {
    renderPortal(children, renderContainer, x, y);
  });

  useLayoutEffect(() => {
    return () => {
      if (renderContainer) {
        ReactDOM.unmountComponentAtNode(renderContainer);
        if (renderContainer.classList.contains('hwReactPopup')) {
          renderContainer.parentElement.removeChild(renderContainer);
        }
      }
    };
  }, [renderContainer]);

  // useLayoutEffect(() => {
  //   renderContainer.current = renderPortal(children, x, y, container)
  //   return () => {
  //     if (renderContainer.current){
  //       console.log('EXPLICIT UNMOUNT')
  //       ReactDOM.unmountComponentAtNode(renderContainer.current);
  //       if (renderContainer.current.classList.contains('hwReactPopup')){
  //         renderContainer.current.parentElement.removeChild(renderContainer.current);
  //         renderContainer.current = null;
  //       }
  //     }
  //   }
  // },[])
  return null;
};
