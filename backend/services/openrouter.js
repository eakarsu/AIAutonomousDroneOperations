require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

/**
 * Robustly parse JSON from AI text that may contain markdown fences.
 */
function parseAIJson(text) {
  try { return JSON.parse(text); } catch (e) {}
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch (e) {}
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(text.slice(start, end + 1)); } catch (e) {} }
  return null;
}

async function queryAI(systemPrompt, userPrompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3001',
        'X-Title': 'AI Drone Operations'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API error');
    }
    return data.choices?.[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenRouter error:', error.message);
    throw error;
  }
}

/**
 * Query AI and return structured JSON. Falls back to wrapped text if parse fails.
 */
async function queryAIStructured(systemPrompt, userPrompt) {
  const text = await queryAI(systemPrompt, userPrompt);
  const parsed = parseAIJson(text);
  if (parsed) return parsed;
  // Fallback: wrap as structured object
  return {
    summary: text.slice(0, 500),
    riskLevel: 'unknown',
    score: null,
    recommendations: [],
    flags: [],
    rawText: text
  };
}

const STRUCTURED_JSON_INSTRUCTION = `
You MUST respond with ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "summary": "<2-3 sentence executive summary>",
  "riskLevel": "<low|medium|high|critical>",
  "score": <0-100 number>,
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "flags": ["<issue or concern 1>", "<issue or concern 2>", ...],
  "details": {
    "<key>": "<value>"
  }
}`;

// AI Services for different features - all return structured JSON
const aiServices = {
  analyzeFlightPlan: async (flightData) => {
    return queryAIStructured(
      `You are an expert drone flight analyst. Analyze the flight plan and provide safety assessment, risk factors, optimization suggestions, and weather considerations. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this drone flight plan:\n${JSON.stringify(flightData, null, 2)}`
    );
  },

  analyzeInspection: async (inspectionData) => {
    return queryAIStructured(
      `You are an expert infrastructure inspector using drone technology. Analyze the inspection data and provide findings assessment, risk rating, recommended actions, and follow-up schedule. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this drone inspection data:\n${JSON.stringify(inspectionData, null, 2)}`
    );
  },

  optimizeRoute: async (routeData) => {
    return queryAIStructured(
      `You are a drone route optimization specialist. Analyze the route and provide optimization suggestions, alternative paths, energy efficiency tips, and no-fly zone considerations. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Optimize this drone route:\n${JSON.stringify(routeData, null, 2)}`
    );
  },

  analyzeAnomaly: async (anomalyData) => {
    return queryAIStructured(
      `You are a drone systems diagnostic expert. Analyze the anomaly and provide root cause analysis, severity assessment, recommended immediate actions, and preventive measures. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this drone anomaly:\n${JSON.stringify(anomalyData, null, 2)}`
    );
  },

  weatherAssessment: async (weatherData) => {
    return queryAIStructured(
      `You are a meteorological expert for drone operations. Assess the weather conditions for drone flight safety, provide go/no-go recommendation, optimal flight windows, and risk mitigation strategies. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Assess these weather conditions for drone flight:\n${JSON.stringify(weatherData, null, 2)}`
    );
  },

  agricultureAnalysis: async (agData) => {
    return queryAIStructured(
      `You are an agricultural drone operations expert. Analyze the field data and provide crop health assessment, treatment recommendations, optimal spraying patterns, and yield predictions. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this agricultural drone operation:\n${JSON.stringify(agData, null, 2)}`
    );
  },

  surveillanceAnalysis: async (survData) => {
    return queryAIStructured(
      `You are a security and surveillance drone expert. Analyze the surveillance data and provide threat assessment, coverage analysis, patrol optimization suggestions, and alert priority rankings. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this surveillance operation:\n${JSON.stringify(survData, null, 2)}`
    );
  },

  maintenancePrediction: async (maintData) => {
    return queryAIStructured(
      `You are a drone maintenance prediction specialist. Analyze the maintenance data and provide predictive maintenance schedule, component life estimates, cost projections, and performance optimization tips. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this drone maintenance data:\n${JSON.stringify(maintData, null, 2)}`
    );
  },

  deliveryOptimization: async (deliveryData) => {
    return queryAIStructured(
      `You are a drone delivery logistics expert. Analyze the delivery data and provide route optimization, delivery time estimates, payload efficiency recommendations, and customer satisfaction insights. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Optimize this drone delivery:\n${JSON.stringify(deliveryData, null, 2)}`
    );
  },

  complianceCheck: async (complianceData) => {
    return queryAIStructured(
      `You are a drone regulatory compliance expert. Analyze the compliance data and provide regulatory status assessment, required actions for compliance, upcoming regulation changes, and risk of non-compliance. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Check compliance status:\n${JSON.stringify(complianceData, null, 2)}`
    );
  },

  flightPerformanceAnalysis: async (flightData) => {
    return queryAIStructured(
      `You are a drone flight performance analyst. Provide detailed performance analysis including efficiency metrics, battery usage optimization, flight pattern analysis, and performance improvement recommendations. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this flight performance data:\n${JSON.stringify(flightData, null, 2)}`
    );
  },

  missionPlanning: async (missionData) => {
    return queryAIStructured(
      `You are a drone mission planning expert. Provide mission planning analysis including resource allocation, timeline optimization, risk assessment, contingency plans, and success probability. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Plan this drone mission:\n${JSON.stringify(missionData, null, 2)}`
    );
  },

  analyticsInsights: async (analyticsData) => {
    return queryAIStructured(
      `You are a drone operations analytics expert. Analyze the operational data and provide trend analysis, KPI insights, performance benchmarks, cost optimization recommendations, and growth projections. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze these drone operation analytics:\n${JSON.stringify(analyticsData, null, 2)}`
    );
  },

  clientRecommendation: async (clientData) => {
    return queryAIStructured(
      `You are a drone services business consultant. Analyze the client data and provide service recommendations, upselling opportunities, satisfaction improvement suggestions, and contract optimization advice. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this client data for drone services:\n${JSON.stringify(clientData, null, 2)}`
    );
  },

  invoiceAnalysis: async (invoiceData) => {
    return queryAIStructured(
      `You are a drone services financial analyst. Analyze the invoice data and provide revenue insights, pricing optimization, payment trend analysis, and profitability recommendations. ${STRUCTURED_JSON_INSTRUCTION}`,
      `Analyze this invoice data:\n${JSON.stringify(invoiceData, null, 2)}`
    );
  }
};

module.exports = { queryAI, queryAIStructured, parseAIJson, aiServices };
