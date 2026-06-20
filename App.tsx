import { StatusBar } from 'expo-status-bar';
import { LogBox, StyleSheet, View } from 'react-native';

import Game from './src/Game';

// Benign deprecation emitted by react-three-fiber v9's internal use of
// THREE.Clock on three r184. Hide the on-screen warning box so it doesn't
// cover gameplay; nothing for us to fix in our own code.
LogBox.ignoreLogs(['THREE.Clock: This module has been deprecated']);

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      <Game />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060f',
  },
});
