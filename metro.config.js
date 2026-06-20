// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// three ships both an ESM build (three.module.js) and a CJS build (three.cjs).
// Under Metro's package-exports resolution, different importers — our app code
// vs. react-three-fiber's native CJS build — can each pull a *different* one, so
// the library gets evaluated twice. That triggers "Multiple instances of
// Three.js being imported" and silently breaks `instanceof` checks across the
// boundary. Pin every bare `three` import to the single ESM build.
const threeEntry = path.resolve(
  __dirname,
  'node_modules/three/build/three.module.js'
);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeEntry };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
