const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');

// Exercise the real module without a live database, mail service, or cloud account.
module.exports = function loadModule(filename, mocks = {}) {
  const module = { exports: {} };
  const requireFromFile = createRequire(filename);
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : requireFromFile(name),
    process, Buffer, URL, console, setTimeout, clearTimeout,
  }, { filename });
  return module.exports;
};
