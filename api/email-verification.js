const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/email-verification');

module.exports = adapt(handler);