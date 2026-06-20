import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Game from './src/Game';

export default function App() {
  return (
    // GestureHandlerRootView must wrap the whole app for gesture controls.
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" hidden />
      <Game />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060f',
  },
});
