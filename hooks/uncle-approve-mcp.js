#!/usr/bin/env node
// Claude Code's --permission-prompt-tool for her Vibecode jobs: a tiny MCP server (stdio, no
// dependencies) with one tool, "approve". Claude Code asks it before a tool that needs permission;
// it asks Uncle Desktop (her local bridge), which asks you on your phone, and answers allow or deny.
'use strict';

const http = require('node:http');
const PORT = Number(process.env.UNCLE_PORT || 47823);
const TOKEN = process.env.UNCLE_APPROVE_TOKEN || '';
const PROJECT = process.env.UNCLE_PROJECT || '';

function ask(toolName, input) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ tool_name: toolName, input, project: PROJECT });
    const req = http.request({ host: '127.0.0.1', port: PORT, path: '/approve', method: 'POST', headers: { 'content-type': 'application/json', 'x-uncle-token': TOKEN, 'content-length': Buffer.byteLength(body) }, timeout: 11 * 60000 }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data).allow === true); } catch { resolve(false); } });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end(body);
  });
}

const reply = (id, result) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
let buffer = '';
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim(); buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.method === 'initialize') reply(msg.id, { protocolVersion: msg.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'uncle', version: '1.0.0' } });
    else if (msg.method === 'tools/list') reply(msg.id, { tools: [{ name: 'approve', description: 'Ask the user (on their phone) whether this tool may run.', inputSchema: { type: 'object', properties: { tool_name: { type: 'string' }, input: { type: 'object' } }, required: ['tool_name'] } }] });
    else if (msg.method === 'tools/call') {
      const { tool_name: toolName, input = {} } = msg.params?.arguments || {};
      const allow = await ask(toolName, input);
      const decision = allow ? { behavior: 'allow', updatedInput: input } : { behavior: 'deny', message: 'The user declined this on their phone.' };
      reply(msg.id, { content: [{ type: 'text', text: JSON.stringify(decision) }] });
    } else if (msg.id !== undefined) reply(msg.id, {});
  }
});
