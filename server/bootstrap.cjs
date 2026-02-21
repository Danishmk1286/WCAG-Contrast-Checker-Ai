// CommonJS bootstrap for cPanel / LiteSpeed Node loader
//
// cPanel's lsnode.js uses `require()` on the "Application startup file".
// Our backend (`server.js`) is an ES module (because of `"type": "module"`
// in package.json and its `import` syntax), so requiring it directly causes:
//   Error [ERR_REQUIRE_ESM]: require() of ES Module server.js not supported
//
// This file is plain CommonJS (.cjs extension forces CJS semantics even
// when `"type": "module"` is set). It simply uses dynamic `import()` to
// load and run the ESM server.

const path = require('path');
const appRoot = path.resolve(__dirname);

// Explicitly add node_modules to Node.js's module search path via NODE_PATH
// This is a common workaround for ERR_MODULE_NOT_FOUND issues in hosted environments for ES Modules.
process.env.NODE_PATH = path.join(appRoot, 'node_modules');
// Important: When setting NODE_PATH programmatically, it often requires manual adjustment
// or for the Node.js process to be re-initialized to fully take effect, but we'll try this first.

(async () => {
  try {
    // Dynamically import the ES module server.js after setting NODE_PATH
    await import('./server.js');
  } catch (err) {
    // Log clearly to stderr so it surfaces in cPanel's stderr.log
    console.error('❌ Failed to bootstrap ES module server.js from bootstrap.cjs');
    console.error(err);
    process.exit(1);
  }
})();


