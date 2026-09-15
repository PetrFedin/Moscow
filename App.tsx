import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MoscowDemoShell from './src/MoscowDemoShell';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MoscowDemoShell />
    </GestureHandlerRootView>
  );
}
