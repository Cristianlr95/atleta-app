const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', 'src', 'app', 'features');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const pages = walk(root).filter((f) => f.endsWith('.page.ts'));
let ngOnInitCount = 0;
let ionViewWillEnterCount = 0;
let subscribeWithoutTeardown = 0;

const rows = [];
for (const page of pages) {
  const content = fs.readFileSync(page, 'utf8');
  const hasNgOnInit = /ngOnInit\s*\(/.test(content);
  const hasIonViewWillEnter = /ionViewWillEnter\s*\(/.test(content);
  const hasSubscribe = /\.subscribe\s*\(/.test(content);
  const hasTeardown = /takeUntilDestroyed|takeUntil\(|DestroyRef|ngOnDestroy\s*\(/.test(content);

  if (hasNgOnInit) ngOnInitCount += 1;
  if (hasIonViewWillEnter) ionViewWillEnterCount += 1;
  if (hasSubscribe && !hasTeardown) subscribeWithoutTeardown += 1;

  rows.push({
    file: page.replace(path.resolve(__dirname, '..', '..') + path.sep, ''),
    hasNgOnInit,
    hasIonViewWillEnter,
    hasSubscribe,
    hasTeardown,
  });
}

const servicesRoot = path.resolve(__dirname, '..', '..', 'src', 'app');
const serviceFiles = walk(servicesRoot).filter((f) => f.endsWith('.ts'));
let pollingHints = 0;
for (const file of serviceFiles) {
  const c = fs.readFileSync(file, 'utf8');
  if (/setTimeout\(|setInterval\(|interval\(|poll|watchMatch|EventSource/.test(c)) {
    pollingHints += 1;
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  pagesTotal: pages.length,
  ngOnInitCount,
  ionViewWillEnterCount,
  subscribeWithoutTeardown,
  pollingHints,
  rows,
};

const outFile = path.resolve(__dirname, 'audit-report.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`Audit written to ${outFile}`);
