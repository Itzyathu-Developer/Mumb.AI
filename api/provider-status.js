const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/provider-status');

module.exports = adapt(handler);