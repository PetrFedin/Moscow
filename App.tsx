import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MoscowDemoShell from './src/MoscowDemoShell';
import { initFieldPilotObservability } from './src/observability/fieldPilotObservability';
import FieldPilotErrorBoundary from './src/observability/FieldPilotErrorBoundary';
import { MoscowThemeProvider } from './src/theme/MoscowTheme';

initFieldPilotObservability();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MoscowThemeProvider>
        <FieldPilotErrorBoundary>
          <MoscowDemoShell />
        </FieldPilotErrorBoundary>
      </MoscowThemeProvider>
    </GestureHandlerRootView>
  );
}
