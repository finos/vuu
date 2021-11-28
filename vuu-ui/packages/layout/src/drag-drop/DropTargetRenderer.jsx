import React from 'react';
import { PopupService } from '@vuu-ui/ui-controls';
import DropMenu, { computeMenuPosition } from './DropMenu';
import { RelativeDropPosition } from './BoxModel';

import './DropTargetRenderer.css';

let _multiDropOptions = false;
let _hoverDropTarget = null;
let _shiftedTab = null;

const onHoverDropTarget = (dropTarget) => (_hoverDropTarget = dropTarget);

const start = ([x, y]) => `M${x},${y}`;
const point = ([x, y]) => `L${x},${y}`;
const pathFromPoints = ([p1, ...points]) => `${start(p1)} ${points.map(point)}Z`;

const pathFromGuideLines = (guideLines) => {
  if (guideLines) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = guideLines;
    return `M${x1},${y1} L${x2},${y2} M${x3},${y3} L${x4},${y4}`;
  } else {
    return '';
  }
};

function insertSVGRoot() {
  if (document.getElementById('hw-drag-canvas') === null) {
    const root = document.getElementById('root');
    const container = document.createElement('div');
    container.id = 'hw-drag-canvas';
    container.innerHTML = `
      <svg width="100%" height="100%">
        <path id="hw-drop-guides" />
        <path
          id="hw-drop-outline"
          d="M300,132 L380,132 L380,100 L460,100 L460,132, L550,132 L550,350 L300,350z">
          <animate
            attributeName="d"
            id="hw-drop-outline-animate"
            begin="indefinite"
            dur="300ms"
            fill="freeze"
            to="M255,33 L255,33,L255,1,L315,1,L315,1,L794,1,L794,164,L255,164Z"
          />
        </path>
      </svg>
      `;
    document.body.insertBefore(container, root);
  }
}
export default class DropTargetCanvas {
  constructor() {
    insertSVGRoot();
    this.currentPath = null;
    this.tabMode = null;
  }

  prepare(dragRect, tabMode = 'full-view') {
    // don't do this on body
    document.body.classList.add('drawing');
    this.currentPath = null;
    this.tabMode = tabMode;

    const { top, left, right, bottom } = dragRect;
    const width = right - left;
    const height = bottom - top;

    const points = this.getPoints(left, top, width, height);
    const d = pathFromPoints(points);

    const dropOutlinePath = document.getElementById('hw-drop-outline');
    dropOutlinePath.setAttribute('d', d);
    this.currentPath = d;
  }

  clear() {
    // don't do this on body
    _hoverDropTarget = null;
    clearShiftedTab();
    document.body.classList.remove('drawing');
    PopupService.hidePopup();
  }

  get hoverDropTarget() {
    return _hoverDropTarget;
  }

  getPoints(x, y, width, height, tabLeft = 0, tabWidth = 0, tabHeight = 0) {
    const tabOnly = this.tabMode === 'tab-only';
    if (tabWidth === 0) {
      return [
        [x, y + tabHeight],
        [x, y + tabHeight],
        [x, y],
        [x + tabWidth, y],
        [x + tabWidth, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height]
      ];
    } else if (tabOnly) {
      const left = tabLeft;
      return [
        [left, y],
        [left, y],
        [left + tabWidth, y],
        [left + tabWidth, y],
        [left + tabWidth, y + tabHeight],
        [left + tabWidth, y + tabHeight],
        [left, y + tabHeight],
        [left, y + tabHeight]
      ];
    } else if (tabLeft === 0) {
      return [
        [x, y + tabHeight],
        [x, y + tabHeight],
        [x, y],
        [x + tabWidth, y],
        [x + tabWidth, y + tabHeight],
        [x + width, y + tabHeight],
        [x + width, y + height],
        [x, y + height]
      ];
    } else {
      return [
        [x, y + tabHeight],
        [x + tabLeft, y + tabHeight],
        [x + tabLeft, y],
        [x + tabLeft, y],
        [x + tabLeft, y + tabHeight],
        [x + width, y + tabHeight],
        [x + width, y + height],
        [x, y + height]
      ];
    }
  }

  draw(dropTarget, dragState) {
    const sameDropTarget = false;
    // _dropTarget !== null &&
    // !dropTarget.pos.tab &&
    // _dropTarget.component === dropTarget.component &&
    // _dropTarget.pos.position === dropTarget.pos.position &&
    // _dropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge;

    const wasMultiDrop = _multiDropOptions;

    if (_hoverDropTarget !== null) {
      this.drawTarget(_hoverDropTarget);
    } else {
      if (sameDropTarget === false) {
        _multiDropOptions = dropTarget.nextDropTarget != null;
        if (dropTarget.pos.tab) {
          moveExistingTabs(dropTarget);
        } else if (_shiftedTab) {
          clearShiftedTab();
        }
        this.drawTarget(dropTarget, dragState);
      }

      if (_multiDropOptions) {
        const [left, top, orientation] = computeMenuPosition(dropTarget);
        if (!wasMultiDrop || !sameDropTarget) {
          const component = (
            <DropMenu
              dropTarget={dropTarget}
              onHover={onHoverDropTarget}
              orientation={orientation}
            />
          );
          PopupService.showPopup({
            left,
            top,
            component
          });
        } else {
          PopupService.movePopupTo(left, top);
        }
      } else {
        PopupService.hidePopup();
      }
    }
  }

  drawTarget(dropTarget, dragState) {
    const lineWidth = 6;

    const targetDropOutline = dropTarget.getTargetDropOutline(lineWidth, dragState);

    if (targetDropOutline) {
      const { l, t, r, b, tabLeft, tabWidth, tabHeight, guideLines } = targetDropOutline;
      const w = r - l;
      const h = b - t;

      if (this.currentPath) {
        const path = document.getElementById('hw-drop-outline');
        path.setAttribute('d', this.currentPath);
      }

      const points = this.getPoints(l, t, w, h, tabLeft, tabWidth, tabHeight);
      const path = pathFromPoints(points);
      const animation = document.getElementById('hw-drop-outline-animate');
      animation.setAttribute('to', path);
      animation.beginElement();
      this.currentPath = path;

      const dropGuidePath = document.getElementById('hw-drop-guides');
      dropGuidePath.setAttribute('d', pathFromGuideLines(guideLines));
    }
  }
}

const cssShiftRight = 'transition:margin-left .4s ease-out;margin-left: 63px';
const cssShiftBack = 'transition:margin-left .4s ease-out;margin-left: 0px';

function moveExistingTabs(dropTarget) {
  const { AFTER, BEFORE } = RelativeDropPosition;
  const {
    clientRect: { Stack },
    pos: {
      tab: { index: tabIndex, positionRelativeToTab }
    }
  } = dropTarget;

  const { id } = dropTarget.component.props;
  let tabEl = null;
  // console.log(`tabPos = ${tabPos} (width=${tabWidth}) x=${x}`)
  if (Stack && positionRelativeToTab !== AFTER) {
    const tabOffset = positionRelativeToTab === BEFORE ? 1 : 2;
    const selector = `:scope .hwTabstrip > .hwTabstrip-inner > .hwTab:nth-child(${
      tabIndex + tabOffset
    })`;
    tabEl = document.getElementById(id).querySelector(selector);
    if (tabEl) {
      if (_shiftedTab === null || _shiftedTab !== tabEl) {
        tabEl.style.cssText = cssShiftRight;
        if (_shiftedTab) {
          _shiftedTab.style.cssText = cssShiftBack;
        }
        _shiftedTab = tabEl;
      }
    } else {
      clearShiftedTab();
    }
  } else if (positionRelativeToTab === BEFORE) {
    if (_shiftedTab === null) {
      const selector = `:scope [class^="hwHeader-title"]`;
      tabEl = document.getElementById(id).querySelector(selector);
      tabEl.style.cssText = cssShiftRight;
      _shiftedTab = tabEl;
    }
  } else {
    clearShiftedTab();
  }
}

function clearShiftedTab() {
  if (_shiftedTab) {
    _shiftedTab.style.cssText = cssShiftBack;
    _shiftedTab = null;
  }
}
