const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createNews, parseFeed, storyKey } = require('../src/main/news');
const { createBriefs } = require('../src/main/briefs');

const rss = (items) => `<rss><channel>${items.map(([t, s, d]) => `<item><title>${t} - ${s}</title><link>https://news.example/${encodeURIComponent(t)}</link><pubDate>${d}</pubDate><source url="x">${s}</source><description>&lt;a&gt;${t}&lt;/a&gt;</description></item>`).join('')}</channel></rss>`;

test('news: Google News items, outlet stripped; Atom too', () => {
  const items = parseFeed(rss([['ทองร่วง 100 ดอลล์', 'ข่าวหุ้น', 'Fri, 30 Oct 2026 10:00:00 GMT']]));
  assert.deepEqual([items[0].title, items[0].source, items[0].text], ['ทองร่วง 100 ดอลล์', 'ข่าวหุ้น', 'ทองร่วง 100 ดอลล์']);
  assert.equal(parseFeed('<feed><entry><title>Hi</title><link href="https://a.b/c"/><updated>2026-10-30T00:00:00Z</updated></entry></feed>')[0].link, 'https://a.b/c');
  assert.equal(storyKey('Gold falls! $100, again'), storyKey('gold falls 100 again'));
});

test('news: the same story once, seen ones not again, blocked outlets out; briefs summarize and notify', async () => {
  const seenFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'news-')), 'seen.json');
  const now = Date.parse('2026-10-31T00:00:00Z');
  const xml = rss([['Gold falls 100 dollars', 'A', 'Fri, 30 Oct 2026 10:00:00 GMT'], ['Gold falls 100 dollars!', 'B', 'Fri, 30 Oct 2026 09:00:00 GMT'], ['Fed holds rates', 'Spam News', 'Fri, 30 Oct 2026 08:00:00 GMT']]);
  const news = createNews({ getSettings: () => ({ topics: ['gold'], lang: 'en', blocked: ['spam'] }), seenFile, now: () => now, fetcher: async () => ({ ok: true, text: async () => xml }) });
  const notes = [];
  const briefs = createBriefs({ news, mcp: { ready: () => false }, ai: async (sys, data) => `SUMMARY(${data.split('\n').length})`, notify: (n) => notes.push(n), getConfig: () => ({ news: { topics: ['gold'] } }) });
  await briefs.newsBrief();
  assert.equal(notes[0].kind, 'news'); assert.deepEqual(notes[0].links.map((l) => l.title), ['Gold falls 100 dollars']);
  await briefs.newsBrief();
  assert.equal(notes.length, 1); // nothing new: nothing sent
  await briefs.dayBrief('morning');
  assert.equal(notes[1].kind, 'brief'); assert.match(notes[1].text, /SUMMARY/);
});
