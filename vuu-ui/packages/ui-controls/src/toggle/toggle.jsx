import React from 'react';

import './toggle.css';

export default class Toggle extends React.Component {
  constructor(props) {
    super(props);

    const { value, values, shortcuts } = props;

    this.state = {
      value: value || values[0]
    };

    if (shortcuts) {
      this.keyMap = shortcuts.reduce((o, char, i) => {
        o[char] = values[i];
        return o;
      }, {});
    }

    this.inputEl = React.createRef();

    this.toggle = this.toggle.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.onFocus = this.onFocus.bind(this);
  }

  handleKeyDown(e) {
    console.log(`[Toggle] handleKeyDown`);
    const { keyMap } = this;
    if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      this.toggle();
      this.commit();
    } else if (e.key === ' ') {
      this.toggle();
    } else if (keyMap && e.key) {
      const mappedValue = keyMap[e.key.toLowerCase()];
      if (mappedValue && mappedValue !== this.state.value) {
        this.toggle();
      }
    }
  }

  focus() {
    if (this.inputEl.current) {
      this.inputEl.current.focus();
    }
  }

  toggle(commit = false) {
    const { values } = this.props;
    const idx = values.indexOf(this.state.value);
    const newIdx = idx === values.length - 1 ? 0 : idx + 1;
    const value = values[newIdx];
    this.setState({ value }, () => {
      if (commit) {
        this.commit();
      }
    });
  }

  onFocus() {
    console.log(`[Toggle] onFocus ==>`);
    // call onFocus props
    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }

  commit() {
    this.props.onCommit(this.state.value);
  }

  render() {
    return (
      <div
        ref={this.inputEl}
        tabIndex={0}
        className="control-toggle"
        onClick={this.toggle}
        onKeyDown={this.handleKeyDown}
        onFocus={this.onFocus}
      >
        <span>{this.state.value}</span>
        <i className="icon material-icons">swap_horiz</i>
      </div>
    );
  }
}
