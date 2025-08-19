const puppeteer = require('puppeteer');
const RawJob = require('../models/RawJob');
const Job = require('../models/Job');
const { filterJobIsIntern } = require('../services/aiFilter');
const topcv = require('./adapters/topcv');

async function runOnce(io) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7' });

  const adapters = [topcv];

  for (const adapter of adapters) {
    try {
      const raws = await adapter.fetchRaw(page, { keyword: 'intern' });
      for (const raw of raws) {
        const key = adapter.getKey(raw);
        await RawJob.updateOne({ key }, { $set: { key, source: adapter.name, url: raw.link || raw.url, payload: raw } }, { upsert: true });

        const normalized = adapter.normalize(raw);
        const ai = filterJobIsIntern({ ...normalized });
        if (!ai.isIntern) continue;

        const upsertDoc = { ...normalized, ai };
        // Deduplicate by source+externalId or by (title+company+url)
        const query = normalized.externalId
          ? { source: adapter.name, externalId: normalized.externalId }
          : { source: adapter.name, title: normalized.title, company: normalized.company, url: normalized.url };

        const saved = await Job.findOneAndUpdate(query, { $set: upsertDoc }, { upsert: true, new: true });
        if (io) {
          io.emit('job:new', { id: saved._id, title: saved.title, company: saved.company, city: saved.location?.city, url: saved.url });
        }
      }
    } catch (err) {
      console.error(`[crawler] ${adapter.name} failed:`, err.message);
    }
  }

  await browser.close();
}

module.exports = { runOnce };



