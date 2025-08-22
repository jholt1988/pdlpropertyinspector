import OpenAI from 'openai';
import { setDefaultOpenAIClient, run } from '@openai/agents';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We'll load the compiled agent module at runtime from the server's dist
// folder (dist/server/src/...) so Node resolves it under the server
// package.json (type: commonjs) and avoids ESM/CommonJS mixing.
declare const require: any;


export async function runEstimateAgent(inventoryItems: any[], userLocation: any, currency = 'USD') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set on server');
  }

  // Initialize OpenAI client on the server
  const openai = new OpenAI({ apiKey });
  try {
    setDefaultOpenAIClient(openai);
  } catch (e) {
    // setDefaultOpenAIClient may throw in some versions; it's okay if it does not exist
    // We still pass the client via the global default when supported.
    console.warn('setDefaultOpenAIClient failed or not available:', (e as Error).message);
  }

  let createRepairEstimatorAgent: any;
  // If running the compiled server, prefer the compiled agent under dist/server/src
  const compiledAgentPath = path.join(__dirname, 'src', 'agent', 'repairEstimateAgent.js');
  try {
    // Use require.resolve to check presence without throwing from require itself
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve ? require.resolve(compiledAgentPath) : null;
    if (resolved) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      createRepairEstimatorAgent = require(resolved).createRepairEstimatorAgent;
    }
  } catch (err) {
    // ignore resolution errors and fallback to source
  }

  if (!createRepairEstimatorAgent) {
    // Fall back to source import (ts-node/dev)
    createRepairEstimatorAgent = (await import('../src/agent/repairEstimateAgent')).createRepairEstimatorAgent;
  }

  const prompt = `Analyze the following items and generate a detailed estimate for ${userLocation.city}, ${userLocation.region}:\n\n${JSON.stringify(inventoryItems, null, 2)}\n\nCurrency: ${currency}`;

  const agent = createRepairEstimatorAgent(userLocation);
  const res = await run(agent, prompt);
  const final = (res as any).finalOutput;
  
  if (!final) {
    console.log('Agent final output:', final);
    console.log('Agent response type:', typeof final);
    throw new Error('Agent did not return a final output');
  }

  console.log('Raw agent output:', final);

  try {
    // Handle markdown code blocks - strip ```json and ``` if present
    let jsonString = final;
    if (typeof final === 'string') {
      // Remove markdown code block wrapper if present
      jsonString = final
        .replace(/^```json\s*/i, '')  // Remove opening ```json
        .replace(/^```\s*/i, '')      // Remove opening ``` (fallback)
        .replace(/\s*```\s*$/i, '')   // Remove closing ```
        .trim();
      
      // Handle cases where the response starts with explanation text
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }

    console.log('Cleaned JSON string:', jsonString);
    const parsed = JSON.parse(jsonString);
    
    // Validate the parsed result has expected structure
    if (!parsed.line_items || !Array.isArray(parsed.line_items)) {
      throw new Error('Invalid response structure: missing line_items array');
    }
    
    return parsed;
  } catch (err) {
    console.error('JSON parsing failed. Raw output:', final);
    console.error('Parse error:', err);
    
    // Last resort: try to extract JSON from anywhere in the response
    if (typeof final === 'string') {
      const jsonMatches = final.match(/\{[\s\S]*?\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.line_items) {
              console.log('Successfully extracted JSON from response');
              return parsed;
            }
          } catch (e) {
            // Continue trying other matches
          }
        }
      }
    }
    
    // Agent didn't return parseable JSON
    throw new Error('Agent returned invalid JSON: ' + String(err));
  }
}
