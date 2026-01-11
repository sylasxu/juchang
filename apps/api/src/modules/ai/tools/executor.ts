/**
 * Tool Executor - 工具执行器
 * 
 * 执行工具并收集结果
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * 执行单个工具
 */
export async function executeTool<TParams, TResult>(
  tool: ToolDefinition<TParams, TResult>,
  params: TParams,
  context: ToolContext
): Promise<ToolResult<TResult>> {
  try {
    return await tool.execute(params, context);
  } catch (error) {
    console.error(`[Tool] ${tool.name} execution failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 批量执行工具
 */
export async function executeTools<TParams, TResult>(
  tools: Array<{ tool: ToolDefinition<TParams, TResult>; params: TParams }>,
  context: ToolContext
): Promise<Array<ToolResult<TResult>>> {
  return Promise.all(
    tools.map(({ tool, params }) => executeTool(tool, params, context))
  );
}
