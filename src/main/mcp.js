'use strict';

// MCP servers for her: the same mcp.json shape as Claude Code ({ mcpServers: { name: { command,
// args, env } | { url, headers } } }), each connected, its tools listed and callable. Her chat
// (main.js) offers them to the AI; her assistant (assistant.js) uses Gmail's and Calendar's.

const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

// a tool that only reads: its own hint, else its name (list, get, search, read…)
const READ_NAME = /^(list|get|search|read|find|query|fetch|lookup|check|describe|current)|[-_](list|get|search|read|find|time|colors|calendars|freebusy)s?$/i;
const readOnly = (tool) => tool.annotations?.readOnlyHint ?? READ_NAME.test(tool.name);

function createMcp({ file, version = '0.0.0', log = () => {} }) {
  const servers = new Map(); // name -> { client, tools, status, error }

  const config = () => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers || {}; } catch { return {}; }
  };
  const save = (mcpServers) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ mcpServers }, null, 2)}\n`);
  };

  async function connect(name, spec) {
    const entry = { status: 'connecting', tools: [], error: null, client: null };
    servers.set(name, entry);
    try {
      const transport = spec.url
        ? new StreamableHTTPClientTransport(new URL(spec.url), { requestInit: { headers: spec.headers || {} } })
        // the whole environment: npx needs PATH, a server its own variables on top
        : new StdioClientTransport({ command: spec.command, args: spec.args || [], env: { ...process.env, ...(spec.env || {}) }, stderr: 'pipe' });
      transport.stderr?.on?.('data', (d) => log(`[mcp ${name}] ${String(d).trim().slice(0, 300)}`));
      const client = new Client({ name: 'uncle-desktop', version });
      await client.connect(transport, { timeout: 60000 });
      const { tools } = await client.listTools();
      Object.assign(entry, { client, tools, status: 'ready' });
    } catch (error) {
      Object.assign(entry, { status: 'error', error: String(error.message || error).slice(0, 200) });
    }
    return entry;
  }

  // (re)connects every server in the file that isn't turned off
  async function start() {
    await stop();
    await Promise.all(Object.entries(config()).filter(([, s]) => !s.disabled).map(([name, spec]) => connect(name, spec)));
    return info();
  }
  async function stop() {
    await Promise.all([...servers.values()].map((s) => s.client?.close().catch(() => {})));
    servers.clear();
  }

  // [{ server, name, description, schema, readOnly }] of every ready server
  const tools = () => [...servers.entries()].filter(([, s]) => s.status === 'ready')
    .flatMap(([server, s]) => s.tools.map((t) => ({ server, name: t.name, description: t.description || '', schema: t.inputSchema || {}, readOnly: readOnly(t) })));

  // the tool's answer as text (what the AI reads next), at most `max` characters
  async function call(server, name, args = {}, { signal, max = 8000 } = {}) {
    const s = servers.get(server);
    if (s?.status !== 'ready') throw new Error(`MCP ${server} ยังไม่พร้อม`);
    if (!s.tools.some((t) => t.name === name)) throw new Error(`ไม่มีเครื่องมือ ${server}/${name}`);
    const result = await s.client.callTool({ name, arguments: args }, undefined, { signal, timeout: 120000 });
    const text = (result.content || []).map((c) => (c.type === 'text' ? c.text : `[${c.type}]`)).join('\n');
    if (result.isError) throw new Error(text.slice(0, 300) || `${name} ทำงานไม่สำเร็จ`);
    return text.length > max ? `${text.slice(0, max)}\n…(ตัดเหลือ ${max} ตัวอักษร)` : text;
  }

  const info = () => Object.keys(config()).map((name) => {
    const s = servers.get(name);
    return { name, disabled: Boolean(config()[name].disabled), status: s?.status || 'off', error: s?.error || null, tools: s?.tools.map((t) => t.name) || [] };
  });
  const ready = (name) => servers.get(name)?.status === 'ready';

  return { start, stop, tools, call, info, ready, config, save, file };
}

module.exports = { createMcp, readOnly };
