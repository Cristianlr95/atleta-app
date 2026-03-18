const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const srcRoot = path.join(repoRoot, 'src', 'app');
const featuresRoot = path.join(srcRoot, 'features');
const routesFile = path.join(srcRoot, 'app.routes.ts');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, out);
    else out.push(fullPath);
  }
  return out;
}

function toRel(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function countRegex(content, regex) {
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function extractRoutes(content) {
  const routeMatches = [...content.matchAll(/path:\s*'([^']+)'/g)];
  return routeMatches.map((match) => match[1]);
}

const pageFiles = walk(featuresRoot).filter((file) => file.endsWith('.page.ts'));
const tsFiles = walk(srcRoot).filter((file) => file.endsWith('.ts'));

const lifecycleRows = pageFiles.map((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const hasNgOnInit = /ngOnInit\s*\(/.test(content);
  const hasIonViewWillEnter = /ionViewWillEnter\s*\(/.test(content);
  return {
    file: toRel(file),
    hasNgOnInit,
    hasIonViewWillEnter,
  };
});

const subscribeRows = tsFiles
  .map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const subscribeCount = countRegex(content, /\.subscribe\s*\(/g);
    if (subscribeCount === 0) return null;
    const hasTeardownHints =
      /takeUntilDestroyed|takeUntil\(|DestroyRef|Subscription|ngOnDestroy\s*\(/.test(content);
    return {
      file: toRel(file),
      subscribeCount,
      hasTeardownHints,
    };
  })
  .filter(Boolean);

const liveServiceRows = tsFiles
  .filter((file) => /live|watch|poll/i.test(path.basename(file)))
  .map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const timers =
      countRegex(content, /setTimeout\s*\(/g) +
      countRegex(content, /setInterval\s*\(/g) +
      countRegex(content, /\binterval\s*\(/g);
    const pollingMentions = countRegex(content, /poll|heartbeat|EventSource|watchMatch/gi);
    if (!timers && !pollingMentions) return null;
    return {
      file: toRel(file),
      timers,
      pollingMentions,
    };
  })
  .filter(Boolean);

const navigationRows = tsFiles
  .filter((file) => !file.endsWith('.spec.ts'))
  .map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const routerNavigateCount = countRegex(content, /router\.navigate(ByUrl)?\s*\(/g);
    const safeNavigateCount = countRegex(content, /safeNavigate(ByUrl)?\s*\(/g);
    return {
      file: toRel(file),
      routerNavigateCount,
      safeNavigateCount,
    };
  })
  .filter((row) => row.routerNavigateCount > 0 || row.safeNavigateCount > 0);

const directNavigateOutsideService = navigationRows.filter((row) => {
  if (row.routerNavigateCount === 0) return false;
  return !row.file.endsWith('core/services/navigation.service.ts');
});

const routesContent = fs.existsSync(routesFile) ? fs.readFileSync(routesFile, 'utf8') : '';
const routes = extractRoutes(routesContent);

const report = {
  generatedAt: new Date().toISOString(),
  routes,
  totals: {
    pages: pageFiles.length,
    pagesWithNgOnInit: lifecycleRows.filter((row) => row.hasNgOnInit).length,
    pagesWithIonViewWillEnter: lifecycleRows.filter((row) => row.hasIonViewWillEnter).length,
    filesWithSubscribe: subscribeRows.length,
    filesWithSubscribeWithoutTeardown: subscribeRows.filter((row) => !row.hasTeardownHints).length,
    navigationSafeCalls: navigationRows.reduce((acc, row) => acc + row.safeNavigateCount, 0),
    directRouterNavigateOutsideNavigationService: directNavigateOutsideService.reduce(
      (acc, row) => acc + row.routerNavigateCount,
      0,
    ),
    liveFilesWithPollingHints: liveServiceRows.length,
  },
  lifecycleRows,
  subscribeRows,
  liveServiceRows,
  navigationRows,
  directNavigateOutsideService,
};

const outFile = path.join(__dirname, 'audit-report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`Audit written to ${toRel(outFile)}`);
