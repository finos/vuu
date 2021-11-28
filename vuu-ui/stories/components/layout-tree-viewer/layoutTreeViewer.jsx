import React from 'react';
import cx from 'classnames';
import Tabs from './staticTabs.jsx';
import { breadcrumb } from '@vuu-ui/layout';

import './layoutTreeViewer.css';

const LTR = 'ltr';
const RTL = 'rtl';
const NO_STYLE = {};

const Toggle = ({ leafNode, expanded, onToggle }) =>
  leafNode ? (
    <div className="toggle-node" />
  ) : (
    <div className="toggle-node active" onClick={() => onToggle(!expanded)}>
      {expanded ? '-' : '+'}
    </div>
  );

const Slide = ({ leafNode, onClick }) =>
  leafNode ? (
    <div className="node-slide" />
  ) : (
    <div className="node-slide active" onClick={onClick}>{`>`}</div>
  );

const Node = ({ root, model, expanded, onToggle, onSelect, onSlide, selected }) => {
  const leafNode = !hasChildren(model);
  return (
    <div className={cx('node', { selected })}>
      <Toggle leafNode={leafNode} expanded={expanded} onToggle={onToggle} />
      <div
        className="node-label"
        onClick={() => onSelect(model)}
      >{`${model.$path} ${model.type}`}</div>
      <Slide leafNode={leafNode} onClick={() => onSlide(model)} />
    </div>
  );
};

class TreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.rootEl = null;
    this.state = { expanded: props.expanded || false, collapsing: false };
    this.toggleNode = this.toggleNode.bind(this);
  }
  render() {
    const { model, root, onSelect, onSlide, showRoot = true, selectedPath } = this.props;
    const { expanded, collapsing } = this.state;
    return (
      <div className={cx('node-container', { root })} ref={(el) => (this.rootEl = el)}>
        {showRoot && (
          <Node
            model={model}
            root={root}
            expanded={expanded}
            selected={selectedPath === model.$path}
            onToggle={this.toggleNode}
            onSelect={onSelect}
            onSlide={onSlide}
          />
        )}
        {(expanded || collapsing || !showRoot) && model.children && (
          <div className={cx('node-children', { expanded: this.props.expanded })}>
            <div className="node-children-inner-container">
              {model.children.map((child, i) => (
                <TreeNode
                  key={i}
                  root={false}
                  model={child}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onSlide={onSlide}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  componentDidUpdate(prevvProps, prevState) {
    let childContainer;

    function transitionEnd() {
      childContainer.classList.replace('expanding', 'expanded');
      childContainer.style.height = 'auto';
      childContainer.removeEventListener('transitionend', transitionEnd);
    }

    const transitionEnd2 = () => {
      childContainer.classList.remove('collapsing', 'expanded');
      childContainer.removeEventListener('transitionend', transitionEnd2);
      this.setState({ expanded: false, collapsing: false });
    };

    if (this.state.expanded && prevState.expanded === false) {
      childContainer = this.rootEl.querySelector('.node-children');
      const { clientHeight } = childContainer.firstChild;
      childContainer.classList.add('expanding');
      childContainer.style.height = `${clientHeight}px`;
      childContainer.addEventListener('transitionend', transitionEnd);
    } else if (prevState.expanded && this.state.expanded === false) {
      childContainer = this.rootEl.querySelector('.node-children');
      const { clientHeight } = childContainer.firstChild;
      childContainer.classList.add('collapsing');
      childContainer.style.height = `${clientHeight}px`;
      setTimeout(() => {
        childContainer.style.height = `0px`;
        childContainer.addEventListener('transitionend', transitionEnd2);
      }, 100);
    }
  }

  toggleNode(expanded) {
    if (expanded === false) {
      this.setState({ expanded, collapsing: true });
    } else {
      this.setState({ expanded, collapsing: false });
    }
  }
}

export default class LayoutTreeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.slideContainer = null;
    console.log(`LayoutTreeViewer constructor`);
    const { tree } = props;
    this.state = {
      rootNode: tree,
      currentNode: tree,
      trail: breadcrumb(tree, tree && tree.$path),
      zoomNode: null,
      zoomDirection: null,
      selectedPath: null
    };

    this.selectPath = this.selectPath.bind(this);
    this.slideNode = this.slideNode.bind(this);
    this.slideBack = this.slideBack.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { tree, selectedPath } = nextProps;
    if (tree !== this.props.tree) {
      this.setState({
        rootNode: tree,
        currentNode: tree,
        trail: breadcrumb(tree, tree.$path),
        zoomNode: null,
        zoomDirection: null,
        selectedNode: null
      });
    }

    if (
      selectedPath &&
      selectedPath !== this.props.selectedPath &&
      selectedPath !== this.state.selectedPath
    ) {
      this.setState({ selectedPath });
    }
  }

  render() {
    const { currentNode, zoomNode, zoomDirection, trail, selectedPath } = this.state;
    const { style = NO_STYLE, tree = null } = this.props;
    const isRoot = currentNode === tree;
    if (tree === null) {
      return <div className="LayoutTreeViewer" style={style} />;
    }
    return (
      <div className="LayoutTreeViewer" style={style}>
        <div className="parent-row">
          <Tabs
            trail={trail}
            onNavigate={this.slideBack}
            onSelect={this.selectPath}
            selectedPath={selectedPath}
          />
        </div>
        <div className="slide-container" ref={(el) => (this.slideContainer = el)}>
          <div className={zoomDirection === RTL ? 'slide slide-1' : 'slide slide-3'}>
            <TreeNode
              model={currentNode}
              root={isRoot}
              selectedPath={selectedPath}
              showRoot={false}
              expanded={true}
              onSelect={this.selectPath}
              onSlide={this.slideNode}
            />
          </div>
          {zoomNode && (
            <div className={zoomDirection === RTL ? 'slide slide-2' : 'slide slide-4'}>
              <TreeNode model={zoomNode} root={false} showRoot={false} expanded={true} />
            </div>
          )}
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const animationEnd = () => {
      this.slideContainer.classList.remove('sliding');
      this.setState({ currentNode: this.state.zoomNode, zoomNode: null, zoomDirection: null });
      this.slideContainer.firstChild.removeEventListener('transitionend', animationEnd);
    };
    if (prevState.zoomNode === null && this.state.zoomNode !== null) {
      setTimeout(() => {
        this.slideContainer.classList.add('sliding');
        this.slideContainer.firstChild.addEventListener('transitionend', animationEnd);
      }, 100);
    }
  }

  selectPath(selectedNode) {
    this.setState({ selectedPath: selectedNode.$path });
    if (this.props.onSelectNode) {
      this.props.onSelectNode(selectedNode);
    }
  }

  slideNode(model) {
    const trail = breadcrumb(this.state.rootNode, model.$path);
    this.setState({ zoomNode: model, zoomDirection: RTL, trail });
  }

  slideBack(model) {
    const trail = breadcrumb(this.state.rootNode, model.$path);
    this.setState({ zoomNode: model, zoomDirection: LTR, trail });
  }
}

const hasChildren = (model) => model.children && model.children.length && !hasLayout(model);
const hasLayout = (model) => model.children.length === 1 && model.children[0].type === 'layout';
