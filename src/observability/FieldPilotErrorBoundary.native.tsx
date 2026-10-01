import React from 'react';

import { recordFieldPilotFailure } from './fieldPilotObservability';

type Props = {
  children: React.ReactNode;
};

type State = {
  failed: boolean;
};

export default class FieldPilotErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    recordFieldPilotFailure({
      kind: 'route-screen-crash',
      sceneId: 'moscow-demo-shell',
      errorClass: 'react-error-boundary'
    });
  }

  render() {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}
