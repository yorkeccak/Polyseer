import { z } from "zod";
import { tool } from "ai";
import { SearchType as ValyuSearchSDKType } from "valyu-js";
import { memoryService } from '@/lib/memory/weaviate-memory';

// Valyu OAuth Proxy URL
const VALYU_OAUTH_PROXY_URL = process.env.VALYU_OAUTH_PROXY_URL ||
  `${process.env.VALYU_APP_URL || 'https://platform.valyu.ai'}/api/oauth/proxy`;

// Global context for Valyu OAuth token (set at request level)
let currentValyuContext: { accessToken?: string } = {};

export function setValyuContext(accessToken?: string) {
  currentValyuContext = { accessToken };
  console.log(`[ValyuContext] Set access token: ${accessToken ? 'present' : 'none'}`);
}

export function clearValyuContext() {
  currentValyuContext = {};
  console.log('[ValyuContext] Cleared');
}

export function getValyuAccessToken(): string | undefined {
  return currentValyuContext.accessToken;
}

// Types for Valyu search results
export interface ValyuSearchResult {
  title: string;
  url: string;
  content: string;
  relevance_score: number;
  source: string;
  metadata?: Record<string, any>;
}

interface ValyuSearchResponse {
  success: boolean;
  results?: ValyuSearchResult[];
  tx_id?: string;
  error?: string;
  total_deduction_dollars?: number;
}

// Input schema for deep search
const deepSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Detailed search query (e.g., "latest advancements in AI for healthcare" or "current price of Bitcoin").'
    ),
  searchType: z
    .enum(["all", "web", "market", "academic", "proprietary"])
    .default("all")
    .describe(
      'Search domain: "academic" for research papers, "web" for web content, "market" for financial data, "all" for comprehensive search, or "proprietary" for Valyu datasets.'
    ),
  startDate: z.string().optional().describe('Optional ISO date (YYYY-MM-DD) to filter results published on/after this date'),
});

// Input schema for web search
const webSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("The search query for web content."),
  startDate: z.string().optional().describe('Optional ISO date (YYYY-MM-DD) to filter results published on/after this date'),
});

// Tool result type for better type safety
export type ValyuToolResult = {
  success: boolean;
  query: string;
  results: ValyuSearchResult[];
  tx_id?: string | null;
  error?: string;
  totalCost?: number; // Cost in dollars
};

/**
 * Call Valyu API via OAuth proxy (valyu mode) or direct API key (self-hosted mode)
 */
async function callValyuApi(
  path: string,
  body: any,
  valyuAccessToken?: string
): Promise<ValyuSearchResponse> {
  const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'self-hosted';

  // Self-hosted mode: Use VALYU_API_KEY directly
  if (isDevelopment && !valyuAccessToken) {
    const apiKey = process.env.VALYU_API_KEY;
    if (!apiKey) {
      console.error('[callValyuApi] Self-hosted mode requires VALYU_API_KEY');
      return {
        success: false,
        error: "Self-hosted mode requires VALYU_API_KEY environment variable",
      };
    }

    console.log('[callValyuApi] Self-hosted mode - using VALYU_API_KEY directly');

    // Import Valyu SDK dynamically
    const { Valyu } = await import('valyu-js');
    const valyu = new Valyu(apiKey, 'https://api.valyu.ai/v1');

    try {
      // Call Valyu SDK directly based on path
      if (path === '/v1/deepsearch') {
        const result = await valyu.search(body.query, body);
        return {
          success: true,
          results: result.results || [],
          tx_id: result.tx_id || undefined,
          total_deduction_dollars: result.total_deduction_dollars,
        };
      }

      return {
        success: false,
        error: `Unknown API path: ${path}`,
      };
    } catch (error: any) {
      console.error('[callValyuApi] SDK error:', error);
      return {
        success: false,
        error: error.message || 'Valyu SDK request failed',
      };
    }
  }

  // Production mode: Require OAuth token
  if (!valyuAccessToken) {
    console.error('[callValyuApi] No Valyu access token - user must sign in with Valyu');
    return {
      success: false,
      error: "Please sign in with Valyu to use search features",
    };
  }

  // Use OAuth proxy - charges to user's org credits
  console.log('[callValyuApi] Using OAuth proxy with user token');
  const response = await fetch(VALYU_OAUTH_PROXY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${valyuAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      method: 'POST',
      body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `Proxy request failed: ${response.status}`,
    };
  }

  return response.json();
}

// Valyu DeepSearch Tool - Comprehensive search across multiple domains
export const valyuDeepSearchTool = tool({
  description:
    "Search Valyu for real-time academic papers, web content, market data, etc. Use for specific, up-to-date information across various domains. Always cite sources using [Title](URL) format.",
  inputSchema: deepSearchInputSchema,
  execute: async ({ query, searchType, startDate }) => {
    // Get Valyu access token from global context (set at request level)
    const valyuAccessToken = getValyuAccessToken();

    const searchTypeMap: { [key: string]: ValyuSearchSDKType } = {
      all: "all",
      web: "web",
      market: "all",
      academic: "proprietary",
      proprietary: "proprietary",
    };
    const mappedSearchType: ValyuSearchSDKType =
      searchTypeMap[searchType] || "all";

    // Compute default startDate if LLM didn't pass one
    const days = Number(process.env.VALYU_DEFAULT_START_DAYS || 180);
    const defaultStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    try {
      console.log(
        `[ValyuDeepSearchTool] Query: "${query}", LLM Type: ${searchType}, Valyu Type: ${mappedSearchType}, startDate=${startDate || defaultStart}, hasToken=${!!valyuAccessToken}`
      );

      const requestBody = {
        query,
        search_type: mappedSearchType,
        max_num_results: 8,
        max_price: 50.0,
        relevance_threshold: 0.5,
        start_date: startDate || defaultStart,
      };
      console.log('[ValyuDeepSearchTool] Request body:', JSON.stringify(requestBody));

      const response = await callValyuApi(
        '/v1/deepsearch',
        requestBody,
        valyuAccessToken
      );

      console.log('[ValyuDeepSearchTool] Raw response:', JSON.stringify(response).slice(0, 500));

      if (!response.success) {
        console.error("[ValyuDeepSearchTool] API Error:", response.error);
        const errorResult: ValyuToolResult = {
          success: false,
          error: response.error || "Valyu API request failed.",
          query,
          results: [],
        };
        return errorResult;
      }

      const cost = response.total_deduction_dollars || 0;
      const resultUrls = (response.results || []).map((r: any) => r.url).filter(Boolean);
      console.log(
        `[ValyuDeepSearchTool] Success. Results: ${response.results?.length}, TX_ID: ${response.tx_id}, Cost: $${cost}`
      );
      console.log(`[ValyuDeepSearchTool] URLs returned: ${resultUrls.slice(0, 5).join(', ')}${resultUrls.length > 5 ? '...' : ''}`);

      let results = response.results || [];

      const toolResult: ValyuToolResult = {
        success: true,
        query,
        results,
        tx_id: response.tx_id,
        totalCost: cost,
      };

      // Optionally ingest into memory if enabled
      try {
        if (process.env.MEMORY_ENABLED === 'true' && toolResult.results.length > 0) {
          await memoryService.storeSearchResults(toolResult.results, query);
        }
      } catch (e) {
        console.warn('[ValyuDeepSearchTool] Memory ingest skipped:', e instanceof Error ? e.message : e);
      }

      return toolResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error.";
      console.error("[ValyuDeepSearchTool] Exception:", errorMessage);
      const errorResult: ValyuToolResult = {
        success: false,
        error: errorMessage,
        query,
        results: [],
      };
      return errorResult;
    }
  },
});

// Valyu Web Search Tool - Dedicated web search
export const valyuWebSearchTool = tool({
  description:
    "Perform a web search using Valyu for up-to-date information from the internet. Always cite sources using [Title](URL) format.",
  inputSchema: webSearchInputSchema,
  execute: async ({ query, startDate }) => {
    // Get Valyu access token from global context (set at request level)
    const valyuAccessToken = getValyuAccessToken();

    // Compute default startDate if LLM didn't pass one
    const days = Number(process.env.VALYU_DEFAULT_START_DAYS || 180);
    const defaultStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    try {
      console.log(`[ValyuWebSearchTool] Web Query: "${query}", startDate=${startDate || defaultStart}, hasToken=${!!valyuAccessToken}`);

      const response = await callValyuApi(
        '/v1/deepsearch',
        {
          query,
          search_type: 'web',
          max_num_results: 8,
          max_price: 30.0,
          relevance_threshold: 0.5,
          start_date: startDate || defaultStart,
        },
        valyuAccessToken
      );

      if (!response.success) {
        console.error("[ValyuWebSearchTool] API Error:", response.error);
        const errorResult: ValyuToolResult = {
          success: false,
          error: response.error || "Valyu Web API request failed.",
          query,
          results: [],
        };
        return errorResult;
      }

      const cost = response.total_deduction_dollars || 0;
      console.log(
        `[ValyuWebSearchTool] Success. Results: ${response.results?.length}, TX_ID: ${response.tx_id}, Cost: $${cost}`
      );

      let results = response.results || [];

      const toolResult: ValyuToolResult = {
        success: true,
        query,
        results,
        tx_id: response.tx_id,
        totalCost: cost,
      };

      // Optionally ingest into memory if enabled
      try {
        if (process.env.MEMORY_ENABLED === 'true' && toolResult.results.length > 0) {
          await memoryService.storeSearchResults(toolResult.results, query);
        }
      } catch (e) {
        console.warn('[ValyuWebSearchTool] Memory ingest skipped:', e instanceof Error ? e.message : e);
      }

      return toolResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error.";
      console.error("[ValyuWebSearchTool] Exception:", errorMessage);
      const errorResult: ValyuToolResult = {
        success: false,
        error: errorMessage,
        query,
        results: [],
      };
      return errorResult;
    }
  },
});
