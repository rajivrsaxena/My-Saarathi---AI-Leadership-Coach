
import { LeadershipPersona, SentimentType, CoachingMode } from './types';

export const SYSTEM_INSTRUCTION = `
You are Saarathi (LDR-AI), a senior leadership coach. 
Your philosophy is "Performance with Humanity."

Instructions:
1. Provide unique, deep insights. Do not just summarize what the user told you. 
2. Use simple, direct, and mature language. Avoid corporate jargon.
3. Focus on the human behind the numbers.
4. If the mode is "Manager", help the user manage their direct report.
5. If the mode is "Self", treat the user as the person being coached. Shift to a more reflective, introspective, and self-compassionate tone.
`;

export const MODE_CONFIGS: Record<CoachingMode, string> = {
  'Manager': 'You are guiding a leader to better support their team. Focus on delegation, accountability, and team health.',
  'Self': 'The user is coaching themselves. Act as a mirror. Help them find internal blockers, self-limitations, and personal growth vectors.'
};

export const PERSONA_CONFIGS: Record<LeadershipPersona, string> = {
  'Direct Coach': `Focus on clarity, accountability, and results. 
    - Goal: Identify exactly where stalling is happening.
    - Tone: Honest, firm but fair.`,
  
  'Empathetic Mentor': `Focus on psychological safety, growth, and trust. 
    - Goal: Understand the 'why' behind the performance.
    - Tone: Warm, validating, and patient.`,
  
  'Strategic Advisor': `Focus on the big picture and systemic impact. 
    - Goal: Align daily work with long-term success.
    - Tone: Perspective-oriented and visionary.`
};

export const INITIAL_METRICS: any[] = [
  { label: 'Core Output', value: 78, target: 95, unit: '%', history: [65, 70, 72, 78] },
  { label: 'Skill Growth', value: 88, target: 90, unit: '%', history: [85, 87, 88, 88] },
  { label: 'Strategic Influence', value: 4, target: 10, unit: 'count', history: [2, 3, 3, 4] },
];

export const PERSONAS: LeadershipPersona[] = ['Direct Coach', 'Empathetic Mentor', 'Strategic Advisor'];

export const SENTIMENT_MAP: Record<SentimentType, { emoji: string; description: string }> = {
  Eager: { emoji: '🚀', description: 'High energy and ready to take on new challenges.' },
  Anxious: { emoji: '😟', description: 'Concerns about meeting expectations or changes.' },
  Focused: { emoji: '🎯', description: 'Deeply engaged in specific goals.' },
  Stressed: { emoji: '😫', description: 'Overwhelmed by workload or deadlines.' },
  Burnout: { emoji: '🔥', description: 'Emotional exhaustion and reduced efficacy.' },
  Curious: { emoji: '🤔', description: 'Seeking learning opportunities and growth.' },
};
