const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/analyze-observation');

module.exports = adapt(handler);