const test = require('node:test');
const assert = require('node:assert/strict');
const { createAssistant, mailsFrom, eventsFrom } = require('../src/main/assistant');

test('assistant: reads search_emails text and list-events JSON', () => {
  const mails = mailsFrom('ID: a1\nSubject: Invoice due\nFrom: Boss <b@x.com>\nDate: Fri\n\nID: a2\nSubject: Hi\nFrom: c@x.com\nDate: Sat\n');
  assert.deepEqual(mails.map((m) => [m.id, m.subject]), [['a1', 'Invoice due'], ['a2', 'Hi']]);
  const events = eventsFrom(JSON.stringify({ events: [
    { id: 'e1', summary: 'Standup', start: { dateTime: '2026-11-01T09:00:00+07:00' }, hangoutLink: 'https://meet.google.com/abc' },
    { id: 'e2', summary: 'Holiday', start: { date: '2026-11-01' } },
  ] }));
  assert.deepEqual(events.map((e) => [e.id, e.link]), [['e1', 'https://meet.google.com/abc']]);
});

test('assistant: alerts new important mail only after the first look, and each meeting once before it starts', async () => {
  const alerts = [];
  let inbox = 'ID: old\nSubject: Old\nFrom: a\nDate: x\n';
  const now = Date.parse('2026-11-01T08:52:00+07:00');
  const mcp = { config: () => ({}), ready: () => true, call: async (server) => (server === 'gmail' ? inbox
    : JSON.stringify({ events: [{ id: 'e1', summary: 'Standup', start: { dateTime: '2026-11-01T09:00:00+07:00' } }, { id: 'e2', summary: 'Later', start: { dateTime: '2026-11-01T11:00:00+07:00' } }] })) };
  const a = createAssistant({ mcp, dir: '.', getConfig: () => ({ eventLead: 10 }), alert: (x) => alerts.push(x) });
  await a.checkMail();
  assert.equal(alerts.length, 0);
  inbox += '\nID: new\nSubject: Contract\nFrom: Client\nDate: y\n';
  await a.checkMail(); await a.checkMail();
  assert.deepEqual(alerts.map((x) => [x.kind, x.subject]), [['mail', 'Contract']]);
  await a.loadEvents(); a.checkEvents(now); a.checkEvents(now + 60000);
  assert.deepEqual(alerts.slice(1).map((x) => [x.kind, x.summary, x.minutes]), [['event', 'Standup', 8]]);
});
