// Copied as is, outside of the Browserify bundle in which `import()` cannot be used.
//
// Used by `gui-extensions.js` to load GUI extensions as native ES modules.
window.xo5ImportModule = url => import(url)
