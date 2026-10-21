# Clock Arithmetic audit verification

Audit completed on 2026-10-21, on branch `fix/clock-arithmetic-audit`.

Published source SHA: `d02f885786fd762ccc36f133ef26e68ca322adb6`. This pins the code, tests and mutation runner. The following documentation/evidence commit does not change those files. No merge, deployment or catalog modification was performed.

## Results

| Gate | Exact result |
|---|---|
| `npm ci` | Passed; 46 packages installed from the existing lockfile |
| `npm test` | **10 passed, 0 failed, 0 skipped** |
| `npm run build` | TypeScript check and production build passed |
| Full Playwright suite, `--retries=0` | **29 passed: 27 claims + 2 accessibility; 0 failed, 0 skipped, 0 retries** |
| Accessibility states | Every act and example, at 1280px and 320px; prediction arrivals/reveals and refusal states included |
| `node scripts/check-mutations.mjs` | **28 of 28 killed**, each with all five steps below; 0 retries and 0 skips |
| Expectations | All pinned mathematical values and `e2e/nontext-baseline.ts` are unchanged |

The formatting-only commit `e056a45773fc256ac8c247164d153f87fa909895` (local `86b377b`) was checked before behavioural edits. Before and after it: **10 unit + 18 claims + 2 accessibility tests passed**, with zero skips/retries. `diff -rq` of the two complete production build directories returned no differences: **byte-for-byte identical output**. All 12 then-existing mutation anchors occurred exactly once after formatting; the final runner has 28 cases and 29 unique patch sites, including the two-part cancellation mutation.

## Browser environment and commands

Local validation used Node 24.19.0, Playwright 1.64.1 and installed Chromium 153.0.8010.0. The configured Chromium download returned an invalid archive in this environment, so an external launch configuration selected that installed executable and two workers. Test bodies, thresholds, retries, port 4747 and strict server isolation were retained. The repository's normal Playwright configuration remains unchanged; its workflow installs Chromium with `npx playwright install chromium`.

```bash
npm ci
npm test -- --reporter=verbose
npm run build
CI=1 npx playwright test --config ../clock.local.config.ts --retries=0
PLAYWRIGHT_CONFIG=../clock.local.config.ts node scripts/check-mutations.mjs
```

The full suite was rerun on the restored source after the mutation run. Each mutation test served a fresh, isolated build directory, never a reused server. The runner verified the artifact hash before and after the browser assertion and compared the rebuilt/restored artifact to the original baseline. It rejects build errors, test timeouts, infrastructure failures, non-assertion failures, multiple/empty test selections, skips and retries as successful kills.

## Arithmetic and learning changes verified

- Each reveal computes its fixed prediction using the arithmetic modules; first activation does not populate an answer. Compute and every example remain reachable.
- Printed multiplication rows determine the permutation verdict; every Bézout table must contain at least three rows.
- CRT inverse cells satisfy both the normalized range and inverse identity. Every rendered CRT check asserts its verdict attribute and class. Deduplication and modulus-one refusal have named tests.
- All five act-4 checks are covered in the negative fixture, including the independent order routes. The nonunit example prints the complete repeating walk and no order.
- Act 5 independently checks the prime-factor table, generator verdict, all subgroup sets, shared secret, search-space size and 1-based guess position for g = 22, 2 and 5.
- The real uncancelled φ(999983) workload is measured first; after changing its input to 97, the test repeatedly requires an empty result and a retired notice for at least five seconds, or twice the measured completion time if longer. Removing both guards was caught by `#result-3` becoming nonempty.
- Clock edges have arrowheads outside the node ring. Unit walks close through 1; nonunit walks use an open path with a dashed repeat edge labelled “cycle.” Thick visited-node rings add a non-colour cue. Browser geometry checks establish that 22 → 1 clears node 0.
- All four copy corrections have browser assertions. The ℤ₁₅* counterexample is accessible after refusing a composite p. Over-budget prime and over-2,000-digit input paths have named fail-closed tests.

At p = 9241, constructing all **64 subgroups** took **2444.6 ms before** and **9.1 ms after** reusing one generator on the same local runtime. Every base/member array was exactly equal, including order. This measures subgroup construction, not the complete browser-rendering time. The unit route now checks search-space size against walked order for every nonzero g at every prime p < 500. Explicit timeouts retain the complete test ranges, with measured times documented in source.

## Five-step mutation evidence

This table was generated from the runner's `mutation-evidence.json`. “Diff” means a non-empty source patch; “hash moved” gives the mutated artifact's SHA-256 prefix. Every mutant compiled successfully. Each row's named test passed before mutation, failed by an assertion on the mutated build, then passed after exact restoration.

Common baseline/restored artifact SHA-256:

`127451e28a4d11dc9dba8bfd016dc478c9b9d089c7a0e7682e27a017d2bcdea4`

| Mutation | 1. Baseline | 2. Diff | 3. Hash moved | 4. Named test red | 5. Restored |
|---|---|---|---|---|---|
| wrong Bezout coefficient | green | 1 patch(es), non-empty | `ed082138d77b` | Bézout every printed row and reduced inverse independently checked | green, exact hash |
| unreduced inverse | green | 1 patch(es), non-empty | `19b3c0edad4a` | Bézout every printed row and reduced inverse independently checked | green, exact hash |
| phi multiplies by p | green | 1 patch(es), non-empty | `58bfb364461c` | Phi drawn units match count and independent formula | green, exact hash |
| order asserted as phi | green | 1 patch(es), non-empty | `ff8e16f4c493` | Euler composite case uses phi rather than n minus one | green, exact hash |
| generator checks only factor2 | green | 1 patch(es), non-empty | `d81f1637eb86` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| CRT omits compatibility | green | 1 patch(es), non-empty | `234a375f54d7` | incompatible CRT | green, exact hash |
| CRT product instead of lcm | green | 1 patch(es), non-empty | `75505d2b4290` | CRT substitutes printed solution and uses lcm for shared factors | green, exact hash |
| search space hardcoded2 | green | 1 patch(es), non-empty | `503695389b51` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| gcd2 falsely invertible | green | 1 patch(es), non-empty | `cdfcf5f2c648` | No inverse gcd2 is a neutral fact | green, exact hash |
| Euler uses n minus1 | green | 1 patch(es), non-empty | `86dbe3c8b5d6` | Euler composite case uses phi rather than n minus one | green, exact hash |
| negative claim deleted | green | 1 patch(es), non-empty | `d1b788ebf283` | Euler negative claim all five checks pass while the cycle has only two elements | green, exact hash |
| fixture Euler exponent off by one | green | 1 patch(es), non-empty | `8625f9e4dcd1` | Euler negative claim all five checks pass while the cycle has only two elements | green, exact hash |
| nonunit row falsely a permutation | green | 1 patch(es), non-empty | `67beae3032c2` | Wrap reductions and every printed multiplication row own their permutation claim | green, exact hash |
| CRT inverse coefficient not normalized | green | 1 patch(es), non-empty | `b56a6aa6be0b` | CRT substitutes printed solution and uses lcm for shared factors | green, exact hash |
| cancel removes terminate and epoch guards | green | 2 patch(es), non-empty | `fac271497a1e` | Changing n mid-computation retires it; same values preserve computed results | green, exact hash |
| nonunit assigned an order | green | 1 patch(es), non-empty | `5605fa93006d` | Break the precondition shows the nonunit walk and independently computed Euler failure | green, exact hash |
| power recurrence adds one | green | 1 patch(es), non-empty | `0764276777e5` | Break the precondition shows the nonunit walk and independently computed Euler failure | green, exact hash |
| selected generator checks wrong base | green | 1 patch(es), non-empty | `87b7aba62c19` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| subgroup exponent off by one | green | 1 patch(es), non-empty | `3dfbbff115bc` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| guess count starts below zero | green | 1 patch(es), non-empty | `116d0aadcc8f` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| DH shared exponent off by one | green | 1 patch(es), non-empty | `e1a4954c67ed` | Generators, subgroups and toy DH search spaces rederive from multiplication | green, exact hash |
| divisor route order off by one | green | 1 patch(es), non-empty | `2c0a58a2b7a3` | Euler negative claim all five checks pass while the cycle has only two elements | green, exact hash |
| Fermat exponent off by one | green | 1 patch(es), non-empty | `6c3cbb165369` | Euler negative claim all five checks pass while the cycle has only two elements | green, exact hash |
| clock drops initial multiplication | green | 1 patch(es), non-empty | `7076ae1492d5` | Clock directed edges match the walk; nonreturning cycles have no edge into 1 | green, exact hash |
| clock sends nonunit cycle into one | green | 1 patch(es), non-empty | `4bf5104bf19f` | Clock directed edges match the walk; nonreturning cycles have no edge into 1 | green, exact hash |
| prime group budget enlarged | green | 1 patch(es), non-empty | `4728dc910a06` | Refuses act5 prime p above 10^4 | green, exact hash |
| text digit budget enlarged | green | 1 patch(es), non-empty | `edbb4203c2a4` | Refuses input over 2,000 digits | green, exact hash |
| CRT dedupe compares wrong residue | green | 1 patch(es), non-empty | `84b8d6c5ffcd` | CRT deduplicates identical congruences with an informational note and solution | green, exact hash |

**Total: 28 of 28 killed.** The committed JSON contains each exact anchor/replacement pair, non-empty diff, full hashes, assertion failure, source SHA and restored status. The three per-case browser logs are written locally under ignored `mutation-logs/` on every run.

The completed catalog handoff is in `catalog-handoff.md`, including real implementation/call-site anchors, GitHub About/topics, provisional visual/category fields, and the read-only served-byte check of the still-existing deployment.

## Published source identity

Command-line Git push lacked credentials, so publication used the connected GitHub account. This changes commit metadata and SHAs, but not the tested files. Every source tree returned by GitHub matched the corresponding local Git tree exactly. The runner’s original observed `sourceSha` values remain intact in the JSON.

| Local tested commit | Published commit | Identical Git tree |
|---|---|---|
| `86b377b2bea704ccaafe4a33d64090c839f14253` | `e056a45773fc256ac8c247164d153f87fa909895` | `f2a68c1796f4e89eaa142952193bac1e6ebe5314` |
| `cedb7f48c30a5b7d7237c6289c30581591e8edfc` | `e281844f2c70ab93d66e4a0c57bba4fdf8d9714c` | `656b68081ec9eb60b5da547480e78ac369b5f148` |
| `c2765ca6d3f7a9f232840a610b3c1d3906c08dd1` | `bc8161861a2ed99c81ff81cb0fe04eae777ffda9` | `4d56daec9f9c84158a65208e3beca1231ac3b75e` |
| `bc90dee9c45be061f7a710ac3540abdbe3697eae` | `8d5cf3b6570fa26e64cb63c42797fa9d3d116d82` | `7341b37ccea36aa1a215b7c01c24ced8123ddfe3` |
| `ce89e60c0acc53a5d5c7a79294f9b26e1ce61dfe` | `d02f885786fd762ccc36f133ef26e68ca322adb6` | `7e370e646e86b56b25575a71c9069ace001445eb` |
