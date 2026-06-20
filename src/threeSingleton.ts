// three's core guards against being imported twice by stashing its revision on
// `window.__THREE__` and warning if it's already set. Under React Native's Fast
// Refresh that single module gets re-evaluated against a *persistent* global, so
// the guard fires a false multiple-instances warning even though Metro bundles
// exactly one copy (metro.config.js pins `three` to a single build, and the
// upstream three issue #32142 confirms this is a re-evaluation artifact, not a
// real duplicate).
//
// Since the single-copy guarantee now lives in the bundler, three's runtime
// heuristic is redundant. Neutralize just that one flag: reads always return
// undefined and writes are swallowed, so the guard silently takes its
// first-import branch every time. No other three logging is affected.
//
// This module must be imported before three — see index.js.
function neutralizeThreeGuard(target: object) {
  try {
    Object.defineProperty(target, '__THREE__', {
      configurable: true,
      get() {
        return undefined;
      },
      set() {
        // swallow three's `window.__THREE__ = REVISION` assignment
      },
    });
  } catch {
    // defineProperty can throw if the property is already locked; ignore.
  }
}

neutralizeThreeGuard(globalThis);
// In React Native `window` is normally an alias of `globalThis`, but guard the
// separate-object case too so three's `typeof window` branch is always covered.
if (typeof window !== 'undefined' && (window as object) !== globalThis) {
  neutralizeThreeGuard(window as object);
}

export {};
