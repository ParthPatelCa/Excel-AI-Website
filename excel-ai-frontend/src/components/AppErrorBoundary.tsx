import { Component, ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { err: unknown }> {
  state = { err: null as unknown };
  static getDerivedStateFromError(err: unknown) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
          <h1>Something broke while loading this page.</h1>
          <p>Please click the button below to try loading it again.</p>
          <button onClick={() => location.reload()}>Retry</button>
          <details style={{ marginTop: 16 }}>
            <summary>Error details</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err)}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
