// a tiny MCP server for the tests: one reading tool, one writing tool
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const server = new McpServer({ name: 'echo', version: '1.0.0' });
server.registerTool('search_notes', { description: 'Search notes', inputSchema: { query: z.string() } }, async ({ query }) => ({ content: [{ type: 'text', text: `found: ${query}` }] }));
server.registerTool('send_note', { description: 'Send a note', inputSchema: { to: z.string() } }, async ({ to }) => ({ content: [{ type: 'text', text: `sent to ${to}` }] }));
server.connect(new StdioServerTransport());
