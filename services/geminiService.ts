import type { PerformanceData, CoachingReport, LeadershipPersona, AppLanguage, CoachingMode, GroundingSource } from '../types';
import { SYSTEM_INSTRUCTION, PERSONA_CONFIGS, MODE_CONFIGS } from '../constants';

const ensureServer = () => {
  if (typeof window !== 'undefined') {
    throw new Error('geminiService must be called from a server-side environment');
  }
};

export const generateCoachingReport = async (
  data: PerformanceData,
  persona: LeadershipPersona,
  language: AppLanguage,
  mode: CoachingMode
): Promise<CoachingReport> => {
  ensureServer();
  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const model = 'gemini-3-pro-preview';

  const personaInstruction = PERSONA_CONFIGS[persona];
  const modeInstruction = MODE_CONFIGS[mode];

  const combinedSystemInstruction = `
    ${SYSTEM_INSTRUCTION}
    
    COACHING PERSPECTIVE: ${mode}
    ${modeInstruction}
    
    ACTIVE LEADERSHIP PERSONA: ${persona}
    ${personaInstruction}
    
    CRITICAL RULES:
    1. DO NOT REPEAT THE INPUT DATA. Tell them what the numbers *mean* for the future.
    2. LANGUAGE: Use ${language}.
    3. If mode is 'Self', phrase findings as personal reflection.
    4. Provide specific tactical n8n automation suggestions in the payload.
  `;

  const prompt = `
    Subject: ${data.employeeName}
    Role: ${data.role}
    Metrics: ${JSON.stringify(data.metrics)}
    Context: ${data.context || 'Regular cycle.'}
    State: ${data.sentiment} (${data.sentimentNotes})

    As a ${persona} in ${mode} mode, provide a deep assessment.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: combinedSystemInstruction,
      thinkingConfig: { thinkingBudget: 2000 },
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallAssessment: { type: Type.STRING },
          empathyNote: { type: Type.STRING },
          performanceGapAnalysis: { type: Type.STRING },
          sentimentInsight: { type: Type.STRING },
          coachingConversationStarters: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          actionPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                deadline: { type: Type.STRING },
                supportNeeded: { type: Type.STRING }
              },
              required: ['task', 'deadline', 'supportNeeded']
            }
          },
          n8nPayload: { type: Type.STRING },
          references: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['overallAssessment', 'empathyNote', 'performanceGapAnalysis', 'sentimentInsight', 'coachingConversationStarters', 'actionPlan', 'n8nPayload', 'references']
      }
    }
  });

  const groundingSources: GroundingSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        groundingSources.push({
          title: chunk.web.title || 'Research Source',
          uri: chunk.web.uri
        });
      }
    });
  }

  try {
    const text = response.text;
    if (!text) throw new Error('Empty response from AI');
    const parsed = JSON.parse(text);
    return { ...parsed, groundingSources } as CoachingReport;
  } catch (e) {
    console.error('Failed to parse AI response', e);
    throw new Error('Invalid response format from AI');
  }
};

export const chatWithLeader = async (
  history: {role: 'user' | 'model', text: string}[],
  message: string,
  persona: LeadershipPersona,
  language: AppLanguage,
  mode: CoachingMode
) => {
  ensureServer();
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const model = 'gemini-3-pro-preview';
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION} Mode: ${mode}. Persona: ${persona}. Lang: ${language}.`,
      thinkingConfig: { thinkingBudget: 1000 },
      tools: [{ googleSearch: {} }]
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
