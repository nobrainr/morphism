Error.stackTraceLimit = Infinity;

var testContext = require.context('./../../src', true, /\.spec\.ts/);

function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

var modules = requireAll(testContext);