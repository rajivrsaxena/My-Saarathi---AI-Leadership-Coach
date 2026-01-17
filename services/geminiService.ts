
import { GoogleGenAI, Type } from "@google/genai";
import { PerformanceData, CoachingReport, LeadershipPersona, AppLanguage, CoachingMode } from '../types';
import { SYSTEM_INSTRUCTION, PERSONA_CONFIGS, MODE_CONFIGS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoachingReport = async (
  data: PerformanceData, 
  persona: LeadershipPersona,
  language: AppLanguage,
  mode: CoachingMode
): Promise<CoachingReport> => {
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
    2. LANGUAGE: Use ${language}. Keep it conversational.
    3. SELF-COACHING SPECIAL: If mode is 'Self', the 'overallAssessment' should be phrased as a personal reflection. The 'empathyNote' should be a self-compassion check.
    4. REFERENCES: List research models used ONLY in the 'references' array.
  `;

  const prompt = `
    Subject: ${data.employeeName}
    Role: ${data.role}
    Metrics: ${JSON.stringify(data.metrics)}
    Context: ${data.context || 'Regular cycle.'}
    State: ${data.sentiment} (${data.sentimentNotes})

    As a ${persona} in ${mode} mode, provide a deep assessment. 
    Output in ${language}.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: combinedSystemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallAssessment: { 
            type: Type.STRING,
            description: "Deep narrative dive into hidden problems and solutions."
          },
          empathyNote: { type: Type.STRING, description: "A high-empathy perspective or self-compassion note." },
          performanceGapAnalysis: { type: Type.STRING },
          sentimentInsight: { type: Type.STRING },
          coachingConversationStarters: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "If mode=Manager, questions for the employee. If mode=Self, questions for introspection."
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
          learningSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          references: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['overallAssessment', 'empathyNote', 'performanceGapAnalysis', 'sentimentInsight', 'coachingConversationStarters', 'actionPlan', 'n8nPayload', 'references']
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Invalid response format from AI");
  }
};

export const chatWithLeader = async (
  history: {role: 'user' | 'model', text: string}[], 
  message: string, 
  persona: LeadershipPersona,
  language: AppLanguage,
  mode: CoachingMode
) => {
  const model = 'gemini-3-pro-preview';
  
  const combinedSystemInstruction = `
    ${SYSTEM_INSTRUCTION}
    COACHING PERSPECTIVE: ${mode}
    ${MODE_CONFIGS[mode]}
    ACTIVE PERSONA: ${persona}
    ${PERSONA_CONFIGS[persona]}
    LANGUAGE: ${language}.
  `;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: combinedSystemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
