/**
 * handler
 */

/* Node modules */

/* Third-party modules */
const yml = require('js-yaml');

/* Files */

const config = {
};

module.exports = input => Promise
  .resolve()
  .then(() => {
    /* JSON is valid YAML */
    const inputArgs = yml.safeLoad(input);
  });
