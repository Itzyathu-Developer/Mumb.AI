function createNetlifyEvent(request) {
  const body = request.body === undefined || request.body === null
    ? null
    : typeof request.body === 'string'
      ? request.body
      : JSON.stringify(request.body);

  return {
    body,
    headers: request.headers || {},
    httpMethod: request.method,
    queryStringParameters: request.query || {},
  };
}

function sendNetlifyResponse(response, result) {
  const statusCode = result?.statusCode || 200;
  const headers = result?.headers || { 'Content-Type': 'application/json' };
  response.status(statusCode).setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  return response.send(result?.body || '');
}

function adapt(handler) {
  return async (request, response) => {
    try {
      const result = await handler(createNetlifyEvent(request));
      return sendNetlifyResponse(response, result);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  };
}

module.exports = { adapt };