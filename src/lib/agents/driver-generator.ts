import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Model helper
const getModelSmall = () => openai('gpt-4o-mini');

const DriversSchema = z.object({
  drivers: z.array(z.string()).min(3).max(5).describe('Key factors that could influence the outcome (3-8 concise factors)'),
  reasoning: z.string().describe('Brief explanation of why these drivers were selected')
});

interface MarketData {
  market_facts: {
    question: string;
    volume?: number;
    liquidity?: number;
  };
  market_state_now: Array<{
    outcome?: string;
    mid?: number | null;
  }>;
}

export async function generateDrivers(marketData: MarketData): Promise<string[]> {
  try {
    const result = await generateObject({
      model: getModelSmall(),
      schema: DriversSchema,
      system: 'You are an expert analyst. Identify the key factors that would most likely influence the outcome of this prediction market.',
      prompt: `Analyze this prediction market and identify 3-5 key drivers that could influence the outcome:

Question: ${marketData.market_facts.question}
Current market price: ${marketData.market_state_now[0]?.mid ? (marketData.market_state_now[0].mid * 100).toFixed(1) + '%' : 'N/A'}
Volume: $${marketData.market_facts.volume?.toLocaleString() || 'N/A'}
Liquidity: $${marketData.market_facts.liquidity?.toLocaleString() || 'N/A'}

Consider factors like:
- Economic indicators
- Political developments  
- Technological progress
- Regulatory changes
- Social trends
- Historical precedents
- Market sentiment drivers

Return the most important factors that could move this market.`,
    });

    console.log(`🎯 Auto-generated drivers: ${result.object.drivers.join(', ')}`);
    console.log(`📝 Reasoning: ${result.object.reasoning}`);
    
    return result.object.drivers;
  } catch (error) {
    console.error('Error generating drivers:', error);
    // Fallback to generic drivers based on question analysis
    return generateFallbackDrivers(marketData.market_facts.question);
  }
}

export function generateFallbackDrivers(question: string): string[] {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('election') || questionLower.includes('political')) {
    return ['Polling data', 'Economic conditions', 'Campaign events', 'Voter turnout'];
  } else if (questionLower.includes('bitcoin') || questionLower.includes('crypto')) {
    return ['Regulatory environment', 'Institutional adoption', 'Market sentiment', 'Technical developments'];
  } else if (questionLower.includes('ai') || questionLower.includes('technology')) {
    return ['Research breakthroughs', 'Compute scaling', 'Regulatory framework', 'Investment funding'];
  } else if (questionLower.includes('climate') || questionLower.includes('environment')) {
    return ['Policy changes', 'Technology adoption', 'Economic incentives', 'International cooperation'];
  } else {
    return ['Market conditions', 'Regulatory environment', 'Public sentiment', 'Economic factors'];
  }
}
