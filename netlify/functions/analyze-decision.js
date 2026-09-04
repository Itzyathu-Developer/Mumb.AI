const { askModel } = require('./ai-helper');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const goal = String(body.goal || '').trim();
    if (!goal) return { statusCode: 400, body: JSON.stringify({ error: 'Missing goal' }) };

    const result = await askModel(
      `You are Mumb.AI, created by Yatharth Bochare (itzyathu_12). Turn a Mumbai decision into useful, clearly labelled AI estimates. Return JSON only with this shape:
{
  "constraints": {"deadlineMinutes": number, "deadlineLabel": string, "budget": number, "crowdPref": "low"|"medium"|"high", "distanceKm": number},
  "options": [{"id": string, "name": string, "etaMinutes": number, "cost": number, "crowd": "Low"|"Medium"|"High", "risk": "Low"|"Medium"|"High", "reliability": number, "distanceKm": number}],
  "timeMachineSlots": [{"label": string, "eta": number}],
  "weeklyItems": [{"day": string, "action": string, "saveMin": number}],
  "explanation": string
}
Use realistic Mumbai transport, food, queue, or outing options. Keep numbers plausible and never present estimates as live facts.`,
      JSON.stringify({ goal, scenario: body.scenario || 'commute', communitySignals: body.communitySignals || [] })
    );

    const constraints = result.constraints && typeof result.constraints === 'object' ? result.constraints : {};
    const options = Array.isArray(result.options) ? result.options.slice(0, 5) : [];
    const timeMachineSlots = Array.isArray(result.timeMachineSlots) ? result.timeMachineSlots.slice(0, 5) : [];
    const weeklyItems = Array.isArray(result.weeklyItems) ? result.weeklyItems.slice(0, 7) : [];
    return {
      statusCode: 200,
      body: JSON.stringify({ constraints, options, timeMachineSlots, weeklyItems, explanation: String(result.explanation || '') }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

exports.handler = handler;