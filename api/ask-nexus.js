const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/ask-nexus');

module.exports = adapt(handler);