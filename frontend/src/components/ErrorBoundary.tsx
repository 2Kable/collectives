import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  islandName: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class IslandErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Error boundary prevents a single island failure from crashing other islands on the page.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flash-error" role="alert">
          Une erreur est survenue lors du chargement de ce composant ({this.props.islandName}).
        </div>
      );
    }
    return this.props.children;
  }
}
