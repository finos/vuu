import React from 'react';
import cx from 'classnames';
import './staticTabs.css';

const Slide = ({ firstNode, onClick }) =>
  firstNode ? <div className="node-slide" /> : <div className="node-slide active">{`<`}</div>;

export default class LayoutTabs extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }
  render() {
    const { trail, selectedNode } = this.props;
    const last = trail.length - 1;
    return (
      <div className="LayoutTabs">
        {trail.map((node, i) => (
          <div key={node.$path} className={cx('node', { selected: node === selectedNode })}>
            <Slide firstNode={i === 0} />
            <div className="node-path" onClick={() => this.onClick(node, i === last)}>
              {node.$path}
            </div>
            <div className="node-label" onClick={() => this.onClick(node, i === last)}>
              {node.type}
            </div>
          </div>
        ))}
      </div>
    );
  }

  onClick(node, isLast) {
    if (isLast) {
      this.props.onSelect(node);
    } else {
      this.props.onNavigate(node);
    }
  }
}
