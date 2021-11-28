import React, { useCallback, useRef } from 'react';
import classnames from 'classnames';
import { Action } from './layout-action';
import { Draggable } from './drag-drop/Draggable';
import useLayout from './useLayout';
import { LayoutContext } from './layout-context';
import { registerComponent } from './registry/ComponentRegistry';
import { followPath } from './utils';
import { getIntrinsicSize } from './layout-reducer/flex-utils';

import './DraggableLayout.css';

const EMPTY_OBJECT = {};

// const tree = (el, depth=0) => {
//   const type = typeOf(el);
//   const spaces = '          ';
//   let str = `\n${spaces.slice(0,depth)}${type}`;
//   if (type !== 'View'){
//     const els = el.props.children || [];
//     (Array.isArray(els) ? els : [els]).forEach(child => {
//       str += tree(child, depth+1)
//     })
//   }

//   return str
// }

// Create a temporary object for dragging, where we don not have an existing object
// e.g dragging a non-selected tab from a Stack
const createElement = (rect, id, instructions) => {
  instructions.RemoveDraggableOnDragEnd = true;
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = `position: absolute;top:${rect.top};left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
  document.body.appendChild(div);
  return div;
};

// We need to add props to restrict drag behaviour to, for example, popups only
const DraggableLayout = function DraggableLayout(inputProps) {
  const [props, ref, layoutDispatch, isRoot] = useLayout('DraggableLayout', inputProps);

  // We shouldn't need this but somewhere the customDispatcher/handleDragStart callback is not
  // being updated and preserves stale ref to props.children, so DragDrop from within a nested
  // LatoutContext (Stack or DraggableLayout) fails.
  const sourceRef = useRef();
  // sourceRef.current = props.children ? props.children[0] : null;
  sourceRef.current = props;

  const dragAction = useRef(null);
  const dragOperation = useRef(null);
  const draggableHTMLElement = useRef();

  const handleDrop = useCallback(
    (dropTarget) => {
      const { dragInstructions, draggedReactElement, originalCSS } = dragOperation.current;
      layoutDispatch({
        type: Action.DRAG_DROP,
        draggedReactElement,
        dragInstructions,
        dropTarget
      });

      if (dragInstructions.RemoveDraggableOnDragEnd) {
        document.body.removeChild(draggableHTMLElement.current);
      } else {
        draggableHTMLElement.current.style.cssText = originalCSS;
        delete draggableHTMLElement.current.dataset.dragging;
      }

      dragAction.current = null;
      dragOperation.current = null;
      draggableHTMLElement.current = null;
    },
    [layoutDispatch]
  );

  const handleDragStart = useCallback(
    async (evt) => {
      const {
        component,
        dragContainerPath,
        dragRect,
        dropTargets,
        instructions = EMPTY_OBJECT,
        path,
        preDragActivity,
        resolveDragStart
      } = dragAction.current;
      const dragPos = { x: evt.clientX, y: evt.clientY };
      const layoutRoot = sourceRef.current;

      const draggedReactElement = component ?? followPath(layoutRoot, path);
      const { id } = draggedReactElement.props;
      const intrinsicSize = getIntrinsicSize(draggedReactElement);

      const element = document.getElementById(id) || createElement(dragRect, id, instructions);
      let originalCSS, dragCSS;

      const { width, height, left, top } = element.getBoundingClientRect();
      dragCSS = `width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index: 100;background-color:#ccc;opacity: 0.6;`;
      // Important that this is set before we call initDrag
      element.dataset.dragging = true;

      resolveDragStart && resolveDragStart(true);

      if (preDragActivity) {
        // console.log('going to wait for pre drag activity to finishs')
        await preDragActivity();
      }

      // console.log(`finally ... start the drag`)
      const dragTransform = Draggable.initDrag(
        layoutRoot,
        dragContainerPath,
        dragRect,
        dragPos,
        {
          drag: handleDrag,
          drop: handleDrop
        },
        intrinsicSize,
        dropTargets
      );

      originalCSS = element.style.cssText;
      element.style.cssText = dragCSS + dragTransform;

      draggableHTMLElement.current = element;

      dragOperation.current = {
        draggedReactElement,
        originalCSS,
        dragRect,
        dragTransform,
        dragInstructions: instructions,
        targetPosition: { left, top }
      };
    },
    [handleDrop]
  );

  const customDispatcher = useCallback(
    (action) => {
      if (isRoot && action.type === Action.DRAG_START) {
        const { evt, ...options } = action;
        dragAction.current = {
          ...options,
          dragContainerPath: '0'
        };
        Draggable.handleMousedown(evt, handleDragStart, options.instructions);
      } else if (action.type === Action.DRAG_START && !action.dragContainerPath) {
        console.log(
          `Nested DraggableLayout is allowing DragStart to bubble local path is ${props.path}`
        );
        layoutDispatch({
          ...action,
          dragContainerPath: props.path
        });
      } else {
        layoutDispatch(action);
      }
    },
    [isRoot, handleDragStart, props.path, layoutDispatch]
  );

  const { className: classNameProp, id, style } = props;

  function handleDrag(x, y) {
    const { targetPosition } = dragOperation.current;
    const left = typeof x === 'number' ? x : targetPosition.left;
    const top = typeof y === 'number' ? y : targetPosition.top;
    if (left !== targetPosition.left || top !== targetPosition.top) {
      dragOperation.current.targetPosition.left = left;
      dragOperation.current.targetPosition.top = top;
      draggableHTMLElement.current.style.top = top + 'px';
      draggableHTMLElement.current.style.left = left + 'px';
    }
  }

  const className = classnames('DraggableLayout', classNameProp);
  return (
    <LayoutContext.Provider value={{ dispatch: customDispatcher }}>
      <div className={className} id={id} ref={ref} style={style}>
        {props.children}
        {/* {React.isValidElement(props.children || props) ? (
          props.children || props
        ) : undefined} */}
      </div>
    </LayoutContext.Provider>
  );
};

const componentName = 'DraggableLayout';

DraggableLayout.displayName = componentName;

export default DraggableLayout;

registerComponent(componentName, DraggableLayout, 'container');
