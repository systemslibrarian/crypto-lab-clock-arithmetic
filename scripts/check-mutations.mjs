// Each mutation starts from committed source, builds, fails its named assertion,
// and restores the exact artifact and a green owning test before the next case.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const config = resolve(root, process.env.PLAYWRIGHT_CONFIG ?? 'playwright.config.ts');
// Serve the exact artifact just hashed: the regular config also builds, which
// would replace the artifact between measurement and the assertion. Preserve
// all browser/test options and forbid reuse of a server from another checkout.
const configDir = mkdtempSync(join(tmpdir(), 'clock-arithmetic-mutations-'));
const testConfig = join(configDir, 'playwright.config.ts');
let artifact,
  buildNumber = 0;
writeFileSync(
  testConfig,
  `
import { defineConfig } from ${JSON.stringify(join(root, 'node_modules/@playwright/test/index.mjs'))};
import base from ${JSON.stringify(config)};
export default defineConfig({
  ...base,
  testDir: ${JSON.stringify(join(root, 'e2e'))},
  webServer: {
    ...base.webServer,
    cwd: ${JSON.stringify(root)},
    command: 'npm run preview -- --port 4747 --strictPort --outDir ' + JSON.stringify(process.env.CLOCK_MUTATION_DIST),
    reuseExistingServer: false,
  },
});
`,
);
process.on('exit', () => rmSync(configDir, { recursive: true, force: true }));
const run = ([cmd, args]) =>
  spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, CI: '1', CLOCK_MUTATION_DIST: artifact },
  });
const pass = (command, label) => {
  const r = run(command);
  if (r.status !== 0) throw Error(`${label}\n${r.stdout}\n${r.stderr}`);
  return r;
};
// A fresh directory per build prevents any prior preview's assets from mixing
// with this artifact. Hash relative paths so exact restoration remains testable.
const build = (label) => {
  artifact = join(configDir, `artifact-${buildNumber++}`);
  pass(['npm', ['run', 'build', '--', '--outDir', artifact]], label);
};
const browser = (title) => [
  'npx',
  [
    'playwright',
    'test',
    'e2e/claims.spec.ts',
    '--project=chromium',
    '--grep',
    title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    '--workers=1',
    '--retries=0',
    '--reporter=json',
    '--config',
    testConfig,
  ],
];
const hash = () => {
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(dir, e.name);
      if (e.isDirectory()) walk(path);
      else {
        h.update(path.slice(artifact.length + 1));
        h.update(readFileSync(path));
      }
    }
  };
  walk(artifact);
  return h.digest('hex');
};
const patch = (file, anchor, replacement) => ({ file, anchor, replacement });
const single = (name, file, anchor, replacement, owner) => ({
  name,
  patches: [patch(file, anchor, replacement)],
  owner,
});
const cases = [
  single(
    'wrong Bezout coefficient',
    'src/nt/euclid.ts',
    's = s0 - q * s1',
    's = s0 + q * s1',
    'Bézout every',
  ),
  single(
    'unreduced inverse',
    'src/nt/euclid.ts',
    'value: mod(s, n)',
    'value: s + mod(0n, n)',
    'Bézout every',
  ),
  single('phi multiplies by p', 'src/nt/phi.ts', '* (p - 1n)', '* p', 'Phi drawn units'),
  single(
    'order asserted as phi',
    'src/nt/order.ts',
    'return { order: k, walk',
    'return { order: phiByFactor(n), walk',
    'Euler composite',
  ),
  single(
    'generator checks only factor2',
    'src/nt/cyclic.ts',
    'factor(p - 1n).map',
    'factor(p - 1n).filter(({ p: q }) => q === 2n).map',
    'Generators, subgroups',
  ),
  single(
    'CRT omits compatibility',
    'src/nt/crt.ts',
    'if (delta % g !== 0n)',
    'if (g === 0n)',
    'incompatible CRT',
  ),
  single(
    'CRT product instead of lcm',
    'src/nt/crt.ts',
    'nextMod = (m / g) * n',
    'nextMod = m * n',
    'CRT substitutes',
  ),
  single(
    'search space hardcoded2',
    'src/nt/toyDh.ts',
    'size: BigInt(members.length)',
    'size: 2n',
    'Generators, subgroups',
  ),
  single(
    'gcd2 falsely invertible',
    'src/nt/euclid.ts',
    'if (g > 1n)',
    'if (g > 2n)',
    'No inverse gcd2',
  ),
  single(
    'Euler uses n minus1',
    'src/ui/act4.ts',
    'euler = pow(A, phi, n)',
    'euler = pow(A, n - 1n, n)',
    'Euler composite',
  ),
  single(
    'negative claim deleted',
    'src/ui/act4.ts',
    'Euler’s identity holding for a base says nothing about how long its cycle is',
    'This base has a short cycle',
    'Euler negative claim',
  ),
  single(
    'fixture Euler exponent off by one',
    'src/ui/act4.ts',
    'euler = pow(A, phi, n)',
    'euler = pow(A, phi + 1n, n)',
    'Euler negative claim',
  ),
  single(
    'nonunit row falsely a permutation',
    'src/ui/act1.ts',
    'gcd(BigInt(i), n) === 1n',
    'gcd(BigInt(i), n) <= 2n',
    'Wrap reductions',
  ),
  single(
    'CRT inverse coefficient not normalized',
    'src/nt/crt.ts',
    'mod(egcdTable(M, N).s, N)',
    'egcdTable(M, N).s',
    'CRT substitutes',
  ),
  {
    name: 'cancel removes terminate and epoch guards',
    owner: 'Changing n mid-computation',
    patches: [
      patch(
        'src/main.ts',
        'state.epoch++;\n  state.worker?.terminate();',
        'state.epoch++;\n  // Mutant: retired worker continues.',
      ),
      patch(
        'src/main.ts',
        'if (version !== state.epoch) return;',
        '// Mutant: stale epoch may publish.',
      ),
    ],
  },
  single(
    'nonunit assigned an order',
    'src/nt/order.ts',
    'if (gcd(a, n) !== 1n) return null;',
    'if (gcd(a, n) !== 1n) return 1n;',
    'Break the precondition',
  ),
  single(
    'power recurrence adds one',
    'src/nt/order.ts',
    'x = (x * a) % n;',
    'x = (x * a + 1n) % n;',
    'Break the precondition',
  ),
  single(
    'selected generator checks wrong base',
    'src/ui/act5.ts',
    'test = isGenerator(g, p)',
    'test = isGenerator(mod(g + 1n, p), p)',
    'Generators, subgroups',
  ),
  single(
    'subgroup exponent off by one',
    'src/nt/cyclic.ts',
    'const base = pow(root, (p - 1n) / d, p);',
    'const base = pow(root, (p - 1n) / d + 1n, p);',
    'Generators, subgroups',
  ),
  single(
    'guess count starts below zero',
    'src/nt/toyDh.ts',
    'let guesses = 0n;',
    'let guesses = -1n;',
    'Generators, subgroups',
  ),
  single(
    'DH shared exponent off by one',
    'src/nt/toyDh.ts',
    'secret = pow(B, a, p)',
    'secret = pow(B, a + 1n, p)',
    'Generators, subgroups',
  ),
  single(
    'divisor route order off by one',
    'src/nt/order.ts',
    'if (pow(a, d, n) === 1n) return d;',
    'if (pow(a, d, n) === 1n) return d + 1n;',
    'Euler negative claim',
  ),
  single(
    'Fermat exponent off by one',
    'src/ui/act4.ts',
    'pow(A, n - 1n, n) === 1n',
    'pow(A, n, n) === 1n',
    'Euler negative claim',
  ),
  single(
    'clock drops initial multiplication',
    'src/ui/clock.ts',
    '[1n, ...walk]',
    '[...walk]',
    'Clock directed edges',
  ),
  single(
    'clock sends nonunit cycle into one',
    'src/ui/clock.ts',
    '[...walk, trace.repeated]',
    '[...walk, 1n]',
    'Clock directed edges',
  ),
  single(
    'prime group budget enlarged',
    'src/nt/cyclic.ts',
    'modulus(p, 10000n);',
    'modulus(p, 100000n);',
    'Refuses act5 prime p above',
  ),
  single(
    'text digit budget enlarged',
    'src/main.ts',
    'x.value.length > 2000',
    'x.value.length > 3000',
    'Refuses input over 2,000 digits',
  ),
  single(
    'CRT dedupe compares wrong residue',
    'src/nt/crt.ts',
    'x.n === c.n && x.a === a',
    'x.n === c.n && x.a === a + 1n',
    'CRT deduplicates',
  ),
  single(
    'Montgomery nPrime sign flipped',
    'src/nt/montgomery.ts',
    'return mod(-setupInverse(N, R), R);',
    'return mod(setupInverse(N, R), R);',
    'Montgomery default trace independently checks cancellation',
  ),
  single(
    'Montgomery cancellation adds with the wrong sign',
    'src/nt/montgomery.ts',
    'const sum = T + mTimesN;',
    'const sum = T - mTimesN;',
    'Montgomery default trace independently checks cancellation',
  ),
  single(
    'Montgomery radix shift is one bit short',
    'src/nt/montgomery.ts',
    'const candidate = sum >> powerOfTwoExponent(R);',
    'const candidate = sum >> (powerOfTwoExponent(R) - 1n);',
    'Montgomery default trace independently checks cancellation',
  ),
  single(
    'Montgomery REDC skips final subtraction',
    'src/nt/montgomery.ts',
    'const result = subtracted ? candidate - N : candidate;',
    'const result = candidate;',
    'Montgomery critical regression exposes raw candidate',
  ),
  single(
    'Montgomery encoding omits R squared',
    'src/nt/montgomery.ts',
    'const input = normalized * context.rSquared;',
    'const input = normalized;',
    'Montgomery default trace independently checks cancellation',
  ),
  single(
    'Montgomery chain squares the wrong value',
    'src/ui/act7.ts',
    'const square = montMultTrace(product.result, product.result, N, context.nPrime, R);',
    'const square = montMultTrace(product.result, aEncoding.result, N, context.nPrime, R);',
    'Montgomery chain retains product and square',
  ),
  single(
    'Montgomery fixed work replaces squares with products',
    'src/nt/montgomery.ts',
    ': montMult(state, state, context.N, context.nPrime, context.R);',
    ': montMult(state, bBar, context.N, context.nPrime, context.R);',
    'Montgomery fixed work separates setup',
  ),
  single(
    'Montgomery negative remainder is not canonicalized',
    'src/ui/act7.ts',
    'return ((value % modulus) + modulus) % modulus;',
    'return value % modulus;',
    'Montgomery negative input uses a canonical residue',
  ),
  single(
    'Montgomery fixed work count is halved',
    'src/ui/act7.ts',
    'const FIXED_WORK_ROUNDS = 4096n;',
    'const FIXED_WORK_ROUNDS = 2048n;',
    'Montgomery fixed work separates setup',
  ),
  single(
    'Montgomery measurement overclaims benchmark evidence',
    'src/ui/act7.ts',
    'They are not a benchmark, a speedup claim, or evidence of constant-time behavior.',
    'They prove this method is faster and constant-time.',
    'Montgomery fixed work separates setup',
  ),
];
const files = [...new Set(cases.flatMap((c) => c.patches.map((p) => p.file)))];
if (run(['git', ['diff', 'HEAD', '--exit-code', '--', ...files]]).status !== 0)
  throw Error('Commit the source baseline before mutation checks.');
// Validate every anchor before starting; a missing/duplicate site is never evidence of a kill.
for (const c of cases)
  for (const p of c.patches)
    if (readFileSync(p.file, 'utf8').split(p.anchor).length !== 2)
      throw Error(`${c.name}: expected exactly one anchor in ${p.file}: ${p.anchor}`);
// Every owner must select exactly one test before any browser or mutation work starts.
for (const c of cases) {
  const listed = run([
    'npx',
    [
      'playwright',
      'test',
      'e2e/claims.spec.ts',
      '--project=chromium',
      '--grep',
      c.owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      '--list',
      '--config',
      testConfig,
    ],
  ]);
  const selected = listed.stdout.split('\n').filter((line) => line.includes('[chromium] ›')).length;
  if (listed.status !== 0 || selected !== 1)
    throw Error(`${c.name}: owner preflight selected ${selected} tests, expected exactly one`);
}

const testResult = (command, slug, phase) => {
  const r = run(command);
  writeFileSync(`mutation-logs/${slug}-${phase}.log`, r.stdout + r.stderr);
  let report;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    throw Error(`${slug} ${phase}: missing Playwright JSON report\n${r.stderr}`);
  }
  const specs = [];
  const visit = (suite) => {
    specs.push(...(suite.specs ?? []));
    for (const s of suite.suites ?? []) visit(s);
  };
  for (const suite of report.suites ?? []) visit(suite);
  if (specs.length !== 1 || specs[0].tests.length !== 1 || specs[0].tests[0].results.length !== 1)
    throw Error(`${slug} ${phase}: expected exactly one named test and zero retries`);
  const result = specs[0].tests[0].results[0];
  return { r, report, result, title: specs[0].title };
};
const green = (command, slug, phase) => {
  const data = testResult(command, slug, phase);
  if (data.r.status !== 0 || data.result.status !== 'passed' || data.report.stats.skipped !== 0)
    throw Error(
      `${slug} ${phase}: owning test is not green; see mutation-logs/${slug}-${phase}.log`,
    );
  return data;
};
mkdirSync('mutation-logs', { recursive: true });
build('baseline build');
const sourceSha = pass(['git', ['rev-parse', 'HEAD']], 'source sha').stdout.trim();
const baseline = hash(),
  evidence = [];
for (const c of cases) {
  const slug = c.name.replaceAll(' ', '-'),
    command = browser(c.owner);
  const unmutated = green(command, slug, 'baseline');
  if (hash() !== baseline) throw Error(`${c.name}: baseline artifact changed`);
  const originals = new Map(c.patches.map((p) => [p.file, readFileSync(p.file, 'utf8')]));
  let record;
  try {
    for (const p of c.patches) {
      const current = readFileSync(p.file, 'utf8');
      if (current.split(p.anchor).length !== 2)
        throw Error(`${c.name}: anchor changed while applying patches`);
      writeFileSync(p.file, current.replace(p.anchor, p.replacement));
    }
    const diff = pass(['git', ['diff', '--', ...originals.keys()]], 'read mutation diff').stdout;
    if (!diff.trim()) throw Error(`${c.name}: empty diff`);
    build(`${c.name}: mutant must compile`);
    const mutant = hash();
    if (mutant === baseline) throw Error(`${c.name}: bundle hash did not move`);
    const red = testResult(command, slug, 'mutant');
    const failures = (red.result.errors ?? []).map((e) => e.message ?? '').join('\n');
    if (
      red.r.status === 0 ||
      red.result.status !== 'failed' ||
      !/expect\(|AssertionError|Error: expect/.test(failures)
    )
      throw Error(`${c.name}: no assertion kill; infrastructure errors and timeouts do not count`);
    if (hash() !== mutant) throw Error(`${c.name}: browser did not retain the mutant build`);
    record = {
      name: c.name,
      sourceSha,
      patches: c.patches,
      namedTest: unmutated.title,
      baselineGreen: true,
      nonEmptyDiff: true,
      sourceDiff: diff,
      baseline,
      mutant,
      bundleHashMoved: true,
      namedTestRed: true,
      assertionFailure: failures,
      retries: 0,
      skips: red.report.stats.skipped,
    };
  } finally {
    for (const [file, original] of originals) writeFileSync(file, original);
    build(`${c.name}: restore build`);
    if (hash() !== baseline) throw Error(`${c.name}: restored hash differs`);
    green(command, slug, 'restored');
  }
  record.restoredGreen = true;
  record.restoredHash = hash();
  evidence.push(record);
  writeFileSync('mutation-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(
    `${c.name}: baseline green; non-empty diff; bundle hash moved; ${record.namedTest} red; restored green`,
  );
}
console.log(`${evidence.length} of ${cases.length} killed; zero retries and skips.`);
