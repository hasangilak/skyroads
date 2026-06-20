import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import Game from './src/Game';

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
