import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MoscowDemoShell from './src/MoscowDemoShell';
import { initFieldPilotObservability } from './src/observability/fieldPilotObservability';
import FieldPilotErrorBoundary from './src/observability/FieldPilotErrorBoundary';

initFieldPilotObservability();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FieldPilotErrorBoundary>
        <MoscowDemoShell />
      </FieldPilotErrorBoundary>
    </GestureHandlerRootView>
  );
}
