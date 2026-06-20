import * as THREE from 'three';

// three r183 deprecated THREE.Clock in favour of THREE.Timer and warns straight
// from the Clock constructor. react-three-fiber still does `new THREE.Clock()`
// for its render loop and depends on Clock's API (`elapsedTime`, `oldTime`,
// `start()`, `stop()`) — none of which THREE.Timer provides — so migrating off
// Clock is r3f's call, not ours, and Clock still works correctly today.
//
// three routes all of its own log/warn/error through an official, overridable
// console hook. Install a handler that swallows just this one deprecation line
// and forwards everything else to the native console verbatim, so genuine three
// diagnostics still surface. This must be set before <Canvas> mounts (i.e. at
// app startup); see index.js.
const SILENCED = /Clock: This module has been deprecated/;

type ThreeConsoleType = 'log' | 'warn' | 'error';

THREE.setConsoleFunction(
  (type: ThreeConsoleType, message: string, ...params: unknown[]) => {
    if (typeof message === 'string' && SILENCED.test(message)) return;
    if (type === 'error') console.error(message, ...params);
    else if (type === 'warn') console.warn(message, ...params);
    else console.log(message, ...params);
  }
);

export {};
