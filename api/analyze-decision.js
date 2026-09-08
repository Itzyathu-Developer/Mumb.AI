const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/analyze-decision');

module.exports = adapt(handler);