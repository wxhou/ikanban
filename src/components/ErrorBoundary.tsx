"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = "/";
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h1 style={styles.title}>页面出错了</h1>
          <p style={styles.description}>应用遇到了意外错误，请尝试刷新页面或返回首页。</p>

          <div style={styles.actions}>
            <button type="button" style={styles.primaryBtn} onClick={this.handleReload}>
              重新加载
            </button>
            <button type="button" style={styles.secondaryBtn} onClick={this.handleGoHome}>
              返回首页
            </button>
          </div>

          {this.state.error && (
            <div style={styles.detailsSection}>
              <button type="button" style={styles.detailsToggle} onClick={this.toggleDetails}>
                {this.state.showDetails ? "收起错误详情 ▲" : "查看错误详情 ▼"}
              </button>
              {this.state.showDetails && (
                <pre style={styles.errorDetails}>
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "1rem",
  } satisfies React.CSSProperties,
  card: {
    maxWidth: 480,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: "2.5rem 2rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center" as const,
  } satisfies React.CSSProperties,
  icon: {
    fontSize: "3rem",
    marginBottom: "0.75rem",
  } satisfies React.CSSProperties,
  title: {
    margin: "0 0 0.5rem",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1a1a1a",
  } satisfies React.CSSProperties,
  description: {
    margin: "0 0 1.5rem",
    fontSize: "0.95rem",
    color: "#666",
    lineHeight: 1.6,
  } satisfies React.CSSProperties,
  actions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  } satisfies React.CSSProperties,
  primaryBtn: {
    padding: "0.6rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#fff",
    backgroundColor: "#1677ff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background-color 0.2s",
  } satisfies React.CSSProperties,
  secondaryBtn: {
    padding: "0.6rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#333",
    backgroundColor: "#fff",
    border: "1px solid #d9d9d9",
    borderRadius: 8,
    cursor: "pointer",
    transition: "border-color 0.2s",
  } satisfies React.CSSProperties,
  detailsSection: {
    marginTop: "1.5rem",
    textAlign: "left" as const,
  } satisfies React.CSSProperties,
  detailsToggle: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: 0,
  } satisfies React.CSSProperties,
  errorDetails: {
    marginTop: "0.75rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: 6,
    fontSize: "0.8rem",
    color: "#c00",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    maxHeight: 200,
    overflowY: "auto" as const,
  } satisfies React.CSSProperties,
};
