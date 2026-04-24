require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function queryAI(systemPrompt, userPrompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Drone Operations'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
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

// AI Services for different features
const aiServices = {
  analyzeFlightPlan: async (flightData) => {
    return queryAI(
      'You are an expert drone flight analyst. Analyze the flight plan and provide safety assessment, risk factors, optimization suggestions, and weather considerations. Format your response with clear sections using markdown headers.',
      `Analyze this drone flight plan:\n${JSON.stringify(flightData, null, 2)}`
    );
  },

  analyzeInspection: async (inspectionData) => {
    return queryAI(
      'You are an expert infrastructure inspector using drone technology. Analyze the inspection data and provide findings assessment, risk rating, recommended actions, and follow-up schedule. Format your response with clear sections.',
      `Analyze this drone inspection data:\n${JSON.stringify(inspectionData, null, 2)}`
    );
  },

  optimizeRoute: async (routeData) => {
    return queryAI(
      'You are a drone route optimization specialist. Analyze the route and provide optimization suggestions, alternative paths, energy efficiency tips, and no-fly zone considerations. Format with clear sections.',
      `Optimize this drone route:\n${JSON.stringify(routeData, null, 2)}`
    );
  },

  analyzeAnomaly: async (anomalyData) => {
    return queryAI(
      'You are a drone systems diagnostic expert. Analyze the anomaly and provide root cause analysis, severity assessment, recommended immediate actions, and preventive measures. Format with clear sections.',
      `Analyze this drone anomaly:\n${JSON.stringify(anomalyData, null, 2)}`
    );
  },

  weatherAssessment: async (weatherData) => {
    return queryAI(
      'You are a meteorological expert for drone operations. Assess the weather conditions for drone flight safety, provide go/no-go recommendation, optimal flight windows, and risk mitigation strategies. Format with clear sections.',
      `Assess these weather conditions for drone flight:\n${JSON.stringify(weatherData, null, 2)}`
    );
  },

  agricultureAnalysis: async (agData) => {
    return queryAI(
      'You are an agricultural drone operations expert. Analyze the field data and provide crop health assessment, treatment recommendations, optimal spraying patterns, and yield predictions. Format with clear sections.',
      `Analyze this agricultural drone operation:\n${JSON.stringify(agData, null, 2)}`
    );
  },

  surveillanceAnalysis: async (survData) => {
    return queryAI(
      'You are a security and surveillance drone expert. Analyze the surveillance data and provide threat assessment, coverage analysis, patrol optimization suggestions, and alert priority rankings. Format with clear sections.',
      `Analyze this surveillance operation:\n${JSON.stringify(survData, null, 2)}`
    );
  },

  maintenancePrediction: async (maintData) => {
    return queryAI(
      'You are a drone maintenance prediction specialist. Analyze the maintenance data and provide predictive maintenance schedule, component life estimates, cost projections, and performance optimization tips. Format with clear sections.',
      `Analyze this drone maintenance data:\n${JSON.stringify(maintData, null, 2)}`
    );
  },

  deliveryOptimization: async (deliveryData) => {
    return queryAI(
      'You are a drone delivery logistics expert. Analyze the delivery data and provide route optimization, delivery time estimates, payload efficiency recommendations, and customer satisfaction insights. Format with clear sections.',
      `Optimize this drone delivery:\n${JSON.stringify(deliveryData, null, 2)}`
    );
  },

  complianceCheck: async (complianceData) => {
    return queryAI(
      'You are a drone regulatory compliance expert. Analyze the compliance data and provide regulatory status assessment, required actions for compliance, upcoming regulation changes, and risk of non-compliance. Format with clear sections.',
      `Check compliance status:\n${JSON.stringify(complianceData, null, 2)}`
    );
  },

  flightPerformanceAnalysis: async (flightData) => {
    return queryAI(
      'You are a drone flight performance analyst. Provide detailed performance analysis including efficiency metrics, battery usage optimization, flight pattern analysis, and performance improvement recommendations. Format with clear sections.',
      `Analyze this flight performance data:\n${JSON.stringify(flightData, null, 2)}`
    );
  },

  missionPlanning: async (missionData) => {
    return queryAI(
      'You are a drone mission planning expert. Provide mission planning analysis including resource allocation, timeline optimization, risk assessment, contingency plans, and success probability. Format with clear sections.',
      `Plan this drone mission:\n${JSON.stringify(missionData, null, 2)}`
    );
  },

  analyticsInsights: async (analyticsData) => {
    return queryAI(
      'You are a drone operations analytics expert. Analyze the operational data and provide trend analysis, KPI insights, performance benchmarks, cost optimization recommendations, and growth projections. Format with clear sections.',
      `Analyze these drone operation analytics:\n${JSON.stringify(analyticsData, null, 2)}`
    );
  },

  clientRecommendation: async (clientData) => {
    return queryAI(
      'You are a drone services business consultant. Analyze the client data and provide service recommendations, upselling opportunities, satisfaction improvement suggestions, and contract optimization advice. Format with clear sections.',
      `Analyze this client data for drone services:\n${JSON.stringify(clientData, null, 2)}`
    );
  },

  invoiceAnalysis: async (invoiceData) => {
    return queryAI(
      'You are a drone services financial analyst. Analyze the invoice data and provide revenue insights, pricing optimization, payment trend analysis, and profitability recommendations. Format with clear sections.',
      `Analyze this invoice data:\n${JSON.stringify(invoiceData, null, 2)}`
    );
  }
};

module.exports = { queryAI, aiServices };
