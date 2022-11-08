import React from 'react';
// TODO
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <>
          <h1>Something went wrong.</h1>
          <p>{this.state.errorMessage}</p>
        </>
      );
    }

    return this.props.children;
  }
}
