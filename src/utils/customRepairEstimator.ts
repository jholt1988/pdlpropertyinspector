import OpenAI from 'openai';
import { Agent, Tool, tool, webSearchTool, run } from '@openai/agents';
import { InspectionItem, EstimateResult } from './agentIntegration';

const costAgent = new Agent({
  name: 'Property Repair Cost Estimator',
  instructions: `You are an expert in estimating repair costs for property inspections.
    You will receive a list of inspection items with their descriptions, issue types, and locations.
    Your task is to estimate the labor and material costs for each item, provide step-by-step repair instructions, and return a detailed cost estimate.`,
  tools: [
    webSearchTool({
      userLocation: {
        type: 'approximate',
        country: 'US',
        region: 'Kansas',
        city: 'Wichita'
      }
    })
  ],
  model: 'gpt-4o'
});

const costApiTool: Tool = tool({
  name: 'get_cost',
  description: 'Retrieves labor or material cost by performing a web search.',
  parameters: {
    type: 'object',
    properties: {
      item_description: { type: 'string', description: 'Description of the item' },
      issue_type: { type: 'string', description: 'Type of issue or repair' },
      area: { type: 'string', description: 'Area or location for cost estimation' }
    },
    required: ['item_description', 'issue_type', 'area'],
    additionalProperties: true
  },
  strict: false,
  async execute(input: unknown) {
    if (
      typeof input === 'object' &&
      input !== null &&
      'item_description' in input &&
      'issue_type' in input &&
      'area' in input
    ) {
      const { item_description, issue_type, area } = input as {
        item_description: string;
        issue_type: string;
        area: string;
      };

      const results = await run(
        costAgent,
        `search for the cost of repairing or replacing a ${item_description} due to ${issue_type} in the area of ${area}. Provide the estimated cost in USD.`
      );
      if (Array.isArray(results) && results.length > 0) {
        const snippet = (results[0] as any).snippet || (results[0] as any).title;
        const match = snippet.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/);
        if (match) return parseFloat(match[0].replace(/[$,]/g, ''));
      }
      return 0;
    } else {
      throw new Error('Invalid input: Expected object with item_description, issue_type, and area properties.');
    }
  }
});

const knowledgeBaseTool: Tool = tool({
  name: 'get_repair_steps',
  description: 'Fetches step-by-step repair instructions via a web search.',
  parameters: {
    type: 'object',
    properties: {
      item_description: { type: 'string', description: 'Description of the item' },
      issue_type: { type: 'string', description: 'Type of issue or repair' }
    },
    required: ['item_description', 'issue_type'],
    additionalProperties: true
  },
  strict: false,
  async execute(input: unknown) {
    if (
      typeof input === 'object' &&
      input !== null &&
      'item_description' in input &&
      'issue_type' in input
    ) {
      const { item_description, issue_type } = input as {
        item_description: string;
        issue_type: string;
      };
      const results = await run(
        costAgent,
        `search for step-by-step repair instructions for a ${item_description} with the issue type of ${issue_type}. Provide the instructions in a list format.`
      );

      if (Array.isArray((results as any).output) && (results as any).output.length > 0) {
        return (results as any).output.slice(0, 3).map((res: any) => res.snippet || res.title);
      }
      return ['Standard repair/installation instructions could not be retrieved for this item.'];
    } else {
      throw new Error('Invalid input: Expected object with item_description and issue_type properties.');
    }
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const repairEstimatorAgent = new Agent({
  tools: [costApiTool, knowledgeBaseTool],
  model: 'gpt-4o',
  instructions: `You are a property repair cost estimator agent. Your task is to provide accurate cost estimates for property repairs based on inspection data and external information.`,
  name: 'Property Repair Estimator Agent'
});

export async function runRepairEstimatorAgent(
  inspectionData: InspectionItem[],
  projectArea: string,
  currency: string = 'USD'
): Promise<EstimateResult> {
  const prompt = `Given the following inspection items:\n${JSON.stringify(inspectionData, null, 2)}\nfor the project area: ${projectArea}, provide a detailed repair cost estimate in ${currency}.`;
  const response = await run(repairEstimatorAgent, prompt);
  if (response && typeof response === 'object' && 'output' in response) {
    return (response as any).output as EstimateResult;
  }
  return response as EstimateResult;
}
