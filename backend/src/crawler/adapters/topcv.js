// Adapter skeleton for TopCV. We keep it resilient by trying multiple selectors.
const SOURCE = 'topcv';

function getKey(raw) {
  // Prefer external id if available; else derive from title+company+url
  if (raw.externalId) return `${SOURCE}:${raw.externalId}`;
  const title = (raw.title || '').trim().toLowerCase();
  const company = (raw.company || '').trim().toLowerCase();
  const url = (raw.link || '').trim().toLowerCase();
  return `${SOURCE}:${title}|${company}|${url}`;
}

function normalize(raw) {
  return {
    source: SOURCE,
    externalId: raw.externalId || undefined,
    title: raw.title || '',
    company: raw.company || '',
    description: raw.description || '',
    skills: raw.skills || [],
    tags: raw.tags || [],
    location: { city: raw.city || '', district: raw.district || '', country: 'VN' },
    salary: raw.salary || undefined,
    type: raw.type || 'intern',
    level: raw.level || undefined,
    url: raw.link || raw.url,
    postDate: raw.postDate ? new Date(raw.postDate) : undefined,
    expireDate: raw.expireDate ? new Date(raw.expireDate) : undefined,
  };
}

async function fetchRaw(page, { keyword = 'intern' } = {}) {
  // Try performing a site search using the UI. Falls back to keyword search URL.
  await page.goto('https://www.topcv.vn', { waitUntil: 'networkidle2', timeout: 60000 });
  const inputSelectors = [
    'input[name="keyword"]',
    'input[name="q"]',
    'input[type="search"]',
    '#keyword',
    '.keyword',
    'input[placeholder*="Tìm"]',
  ];

  let navigated = false;
  for (const sel of inputSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 4000 });
      await page.click(sel);
      await page.keyboard.type(keyword, { delay: 25 });
      try { await page.keyboard.press('Enter'); } catch (_) {}
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      navigated = true;
      break;
    } catch (_) {}
  }
  if (!navigated) {
    const urls = [
      `https://www.topcv.vn/tim-viec-lam?keyword=${encodeURIComponent(keyword)}`,
      `https://www.topcv.vn/viec-lam?keyword=${encodeURIComponent(keyword)}`,
    ];
    for (const u of urls) {
      try { await page.goto(u, { waitUntil: 'networkidle2', timeout: 30000 }); break; } catch (_) {}
    }
  }

  // Extract simple list
  const rawJobs = await page.evaluate(() => {
    const selectors = ['.job-item', '.job__list-item', '.job-card', 'article.job-item', '.job-list .job', '.list-job .job'];
    let nodes = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found && found.length) { nodes = found; break; }
    }
    const arr = Array.from(nodes).map(el => {
      const pickText = (sels) => {
        for (const s of sels) {
          const node = el.querySelector(s);
          if (node && node.textContent) return node.textContent.trim();
        }
        return null;
      };
      const pickHref = (sels) => {
        for (const s of sels) {
          const a = el.querySelector(s);
          if (a && a.href) return a.href;
        }
        return null;
      };
      const title = pickText(['.title', '.job-title', 'a.job-title', 'h3', 'h2 a', 'a', '.job-name']);
      const company = pickText(['.company', '.company-name', '.company__name', '.job-company', '.company .name', '.company-name a']);
      const link = pickHref(['a.job-title', 'h3 a', 'h2 a', 'a']);
      return { title, company, link };
    });
    return arr.filter(j => j.title);
  });

  return rawJobs;
}

module.exports = { name: SOURCE, fetchRaw, normalize, getKey };



