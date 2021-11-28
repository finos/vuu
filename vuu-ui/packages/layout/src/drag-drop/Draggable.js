import DropTargetRenderer from './DropTargetRenderer';
import DragState from './DragState';
import { findTarget, followPath, getProps } from '../utils';
import { BoxModel, Position } from './BoxModel';
import { identifyDropTarget } from './DropTarget';
import { DropTarget } from './DropTarget';

let _dragStartCallback;
let _dragMoveCallback;
let _dragEndCallback;

let _dragStartX;
let _dragStartY;
let _dragContainer;
let _dragState;
let _dropTarget = null;
let _validDropTargets;
let _dragInstructions;
let _measurements;
let _simpleDrag;
let _dragThreshold;

const DEFAULT_DRAG_THRESHOLD = 5;
const _dropTargetRenderer = new DropTargetRenderer();
const SCALE_FACTOR = 0.4;

function getDragContainer(rootContainer, dragContainerPath) {
  if (dragContainerPath) {
    return followPath(rootContainer, dragContainerPath);
  } else {
    return findTarget(rootContainer, (props) => props.dropTarget);
  }
}

export const Draggable = {
  handleMousedown(e, dragStartCallback, dragInstructions = {}) {
    _dragStartCallback = dragStartCallback;
    _dragInstructions = dragInstructions;

    _dragStartX = e.clientX;
    _dragStartY = e.clientY;

    _dragThreshold =
      dragInstructions.dragThreshold === undefined
        ? DEFAULT_DRAG_THRESHOLD
        : dragInstructions.dragThreshold;

    if (_dragThreshold === 0) {
      // maybe this should be -1
      _dragStartCallback(e, 0, 0);
    } else {
      window.addEventListener('mousemove', preDragMousemoveHandler, false);
      window.addEventListener('mouseup', preDragMouseupHandler, false);
    }

    e.preventDefault();
  },

  // called from handleDragStart (_dragCallback)
  initDrag(
    rootContainer,
    dragContainerPath,
    { top, left, right, bottom },
    dragPos,
    dragHandler,
    intrinsicSize,
    dropTargets
  ) {
    ({ drag: _dragMoveCallback, drop: _dragEndCallback } = dragHandler);
    return initDrag(
      rootContainer,
      dragContainerPath,
      { top, left, right, bottom },
      dragPos,
      intrinsicSize,
      dropTargets
    );
  }
};

function preDragMousemoveHandler(e) {
  var x = true;
  var y = true;

  let x_diff = x ? e.clientX - _dragStartX : 0;
  let y_diff = y ? e.clientY - _dragStartY : 0;
  let mouseMoveDistance = Math.max(Math.abs(x_diff), Math.abs(y_diff));

  // when we do finally move the draggee, we are going to 'jump' by the amount of the drag threshold, should we
  // attempt to animate this ?
  if (mouseMoveDistance > _dragThreshold) {
    window.removeEventListener('mousemove', preDragMousemoveHandler, false);
    window.removeEventListener('mouseup', preDragMouseupHandler, false);
    _dragStartCallback(e, x_diff, y_diff);
    _dragStartCallback = null;
  }
}

function preDragMouseupHandler() {
  window.removeEventListener('mousemove', preDragMousemoveHandler, false);
  window.removeEventListener('mouseup', preDragMouseupHandler, false);
}

function initDrag(rootContainer, dragContainerPath, dragRect, dragPos, intrinsicSize, dropTargets) {
  _dragContainer = getDragContainer(rootContainer, dragContainerPath);

  const { 'data-path': dataPath, path = dataPath } = getProps(_dragContainer);

  if (dropTargets) {
    const dropPaths = dropTargets
      .map((id) => findTarget(rootContainer, (props) => props.id === id))
      .map((target) => target.props.path);
    _validDropTargets = dropPaths;
    console.log(`dropPaths = ${dropPaths}`);
  }

  // var start = window.performance.now();
  // translate the layout $position to drag-oriented co-ordinates, ignoring splitters
  console.log(`measure, taking into account dropTargets (${dropTargets})`);
  _measurements = BoxModel.measure(_dragContainer, dropTargets);
  console.log({ _measurements });
  // console.log({ measurements: _measurements });
  // var end = window.performance.now();
  // console.log(`[Draggable] measurements took ${end - start}ms`, _measurements);

  var dragZone = _measurements[path];

  _dragState = new DragState(dragZone, dragPos.x, dragPos.y, dragRect, intrinsicSize);

  var pctX = Math.round(_dragState.x.mousePct * 100);
  var pctY = Math.round(_dragState.y.mousePct * 100);

  window.addEventListener('mousemove', dragMousemoveHandler, false);
  window.addEventListener('mouseup', dragMouseupHandler, false);

  _simpleDrag = false;

  _dropTargetRenderer.prepare(dragRect, 'tab-only');

  return _dragInstructions.DoNotTransform
    ? 'transform:none'
    : // scale factor should be applied in caller, not here
      `transform:scale(${SCALE_FACTOR},${SCALE_FACTOR});transform-origin:${pctX}% ${pctY}%;`;
}

function dragMousemoveHandler(evt) {
  const x = evt.clientX;
  const y = evt.clientY;
  const dragState = _dragState;
  var currentDropTarget = _dropTarget;
  var dropTarget;

  var newX, newY;

  // console.log(`mouseMove ${x},${y}`)

  if (dragState.update('x', x)) {
    newX = dragState.x.pos;
  }

  if (dragState.update('y', y)) {
    newY = dragState.y.pos;
  }

  if (newX === undefined && newY === undefined) {
    //onsole.log('both x and y are unchanged');
  } else {
    _dragMoveCallback(newX, newY);
  }

  if (_simpleDrag) {
    return;
  }

  if (dragState.inBounds()) {
    dropTarget = identifyDropTarget(
      x,
      y,
      _dragContainer,
      _measurements,
      dragState.hasIntrinsicSize(),
      _validDropTargets
    );
  } else {
    dropTarget = identifyDropTarget(
      dragState.dropX(),
      dragState.dropY(),
      _dragContainer,
      _measurements
    );
  }

  // did we have an existing droptarget which is no longer such ...
  if (currentDropTarget) {
    if (dropTarget == null || dropTarget.box !== currentDropTarget.box) {
      _dropTarget = null;
    }
  }

  if (dropTarget) {
    _dropTargetRenderer.draw(dropTarget, dragState);
    _dropTarget = dropTarget;
  }
}

function dragMouseupHandler() {
  onDragEnd();
}

function onDragEnd() {
  if (_dropTarget) {
    const dropTarget =
      _dropTargetRenderer.hoverDropTarget || DropTarget.getActiveDropTarget(_dropTarget);

    _dragEndCallback(dropTarget);

    _dropTarget = null;
  } else {
    _dragEndCallback({
      component: _dragContainer,
      pos: { position: Position.Absolute }
    });
  }

  _dragMoveCallback = null;
  _dragEndCallback = null;

  _dragContainer = null;
  _dropTargetRenderer.clear();
  _validDropTargets = null;
  window.removeEventListener('mousemove', dragMousemoveHandler, false);
  window.removeEventListener('mouseup', dragMouseupHandler, false);
}
