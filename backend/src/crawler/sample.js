const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

async function crawlInternJobs() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Giả lập trình duyệt thật để giảm chặn bot
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7' });
  await page.setViewport({ width: 1366, height: 768 });

  // 1) Truy cập trang chủ và thực hiện tìm kiếm "intern" bằng thao tác người dùng
  await page.goto('https://www.topcv.vn', { waitUntil: 'networkidle2', timeout: 60000 });
  // cố gắng tìm input tìm kiếm theo nhiều selector khác nhau
  const inputSelectors = [
    'input[name="keyword"]',
    'input[name="q"]',
    'input[type="search"]',
    '#keyword',
    '.keyword',
    'input[placeholder*="Tìm"]',
  ];

  let foundInput = false;
  for (const sel of inputSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 7000 });
      await page.click(sel, { delay: 50 });
      await page.type(sel, 'intern', { delay: 50 });
      foundInput = true;
      break;
    } catch (_) {}
  }

  // Nếu không tìm thấy input, fallback sang URL tìm kiếm dự đoán
  if (!foundInput) {
    const fallbackSearchUrls = [
      'https://www.topcv.vn/tim-viec-lam?keyword=intern',
      'https://www.topcv.vn/viec-lam?keyword=intern',
      'https://www.topcv.vn/tim-viec-lam-intern',
    ];
    for (const u of fallbackSearchUrls) {
      try {
        await page.goto(u, { waitUntil: 'networkidle2', timeout: 60000 });
        break;
      } catch (_) {}
    }
  } else {
    // thử bấm Enter hoặc nút tìm kiếm
    try { await page.keyboard.press('Enter'); } catch (_) {}
    const searchBtnSelectors = ['button[type="submit"]', '.btn-search', '.search-btn'];
    for (const sel of searchBtnSelectors) {
      try { await page.click(sel, { delay: 50 }); break; } catch (_) {}
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  }

  // Cuộn để tải lazy content ở trang kết quả
  await autoScroll(page);

  // 2) Đợi một trong các selector khả dĩ xuất hiện
  const candidateSelectors = [
    '.job-item',
    '.job__list-item',
    '.job-card',
    'article.job-item',
    '.job-list .job',
    '.list-job .job',
  ];

  let hasAnySelector = false;
  for (const sel of candidateSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 8000 });
      hasAnySelector = true;
      break;
    } catch (_) {}
  }

  const jobs = await page.evaluate(() => {
    const containerSelectors = [
      '.job-item',
      '.job__list-item',
      '.job-card',
      'article.job-item',
      '.job-list .job',
      '.list-job .job',
    ];

    let cards = [];
    for (const sel of containerSelectors) {
      const found = Array.from(document.querySelectorAll(sel));
      if (found.length >= 5) { cards = found; break; }
      if (found.length > cards.length) cards = found;
    }

    const getText = (root, selectors) => {
      for (const s of selectors) {
        const el = root.querySelector(s);
        if (el && el.textContent) return el.textContent.trim();
      }
      return null;
    };

    const getHref = (root, selectors) => {
      for (const s of selectors) {
        const a = root.querySelector(s);
        if (a && a.href) return a.href;
      }
      return null;
    };

    const titleSelectors = ['.title', '.job-title', 'a.job-title', 'h3', 'h2 a', 'a', '.job-name', '.bold'];
    const companySelectors = ['.company', '.company-name', '.company__name', '.job-company', '.company .name', '.company-name a'];
    const linkSelectors = ['a.job-title', 'h3 a', 'h2 a', 'a'];

    const results = cards.map(card => {
      const title = getText(card, titleSelectors);
      const company = getText(card, companySelectors);
      const link = getHref(card, linkSelectors);
      return { title, company, link };
    }).filter(j => j.title && /intern|thực tập|internship/i.test(j.title));

    return results.slice(0, 50);
  });

  if (!jobs || jobs.length === 0) {
    // Ghi file debug để kiểm tra selector
    const tmpDir = path.join(process.cwd(), 'tmp');
    try { if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir); } catch (_) {}

    try {
      const html = await page.content();
      await fs.promises.writeFile(path.join(tmpDir, 'topcv.html'), html, 'utf8');
    } catch (_) {}

    try {
      await page.screenshot({ path: path.join(tmpDir, 'topcv.png'), fullPage: true });
    } catch (_) {}
  }

  console.log(`Found ${jobs?.length || 0} intern jobs`);
  if (jobs && jobs.length > 0) {
    console.log(jobs.slice(0, 10));
  } else {
    console.log('No jobs extracted. See tmp/topcv.html and tmp/topcv.png to inspect the page structure.');
  }

  await browser.close();
}

crawlInternJobs();