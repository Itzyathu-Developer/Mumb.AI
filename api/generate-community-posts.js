const { adapt } = require('./_netlify-adapter');
const { handler } = require('../netlify/functions/generate-community-posts');

module.exports = adapt(handler);