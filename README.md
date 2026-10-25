# Clock Arithmetic

## What It Is

Exact, inspectable BigInt number theory underneath RSA and finite-field Diffie–Hellman: modular arithmetic, extended Euclid, Euler φ, multiplicative orders, generators, subgroups, generalized CRT and Montgomery reduction. The computations check their own preconditions and use independent routes where feasible. This is a small-number teaching lab, not production cryptography.

## Exhibits

1. **Wrap around:** reduce signed integers; draw discrete clocks through modulus 24 and residue strips above it; inspect addition and multiplication tables through 13.
2. **Undo multiplication:** step Euclid, check every Bézout row, derive a normalized inverse, and recognize shared-factor failures.
3. **Count units:** compare enumeration with the prime-factor formula. Unit lists paginate in groups of 200; the exact count includes all units.
4. **Watch powers cycle:** compare a walk with divisor-based order computation, check Euler/Fermat/Lagrange, and observe that Euler can hold for a cycle of length two.
5. **Generators and subgroups:** inspect every element’s order and every prime-factor generator check. A toy DH separates the possible-secret count from the number of guesses actually used.
6. **Recombine remainders:** step generalized CRT, reject incompatible congruences, deduplicate repeats, and use the lcm for compatible noncoprime moduli.
7. **Montgomery multiplication:** choose an explicit power-of-two radix, encode through REDC, inspect low-word cancellation, radix shifting and final subtraction, keep a product-and-square chain encoded, then decode once. A fixed 4,096-operation comparison measures setup, ordinary repeated work, Montgomery repeated work and final decoding separately.

## When to Use It

Use it to learn the arithmetic vocabulary before RSA, finite-field DH or discrete-log attacks. Predict each outcome before computing and compare the counterexamples. Do **not** use it to generate or protect real keys, test large numbers for primality, or benchmark real cryptographic attacks.

## Live Demo

[Open Clock Arithmetic](https://systemslibrarian.github.io/crypto-lab-clock-arithmetic/). Predict first, then click Compute or an example to inspect every computed row. Each reveal answers its own fixed prediction using the arithmetic modules. Input changes cancel the Worker and retire dependent results; a no-op leaves them intact.

## What Can Go Wrong

An inverse requires gcd one. Euler requires a unit. A whole-group generator must pass the check for every prime dividing the group order. A proper prime-order subgroup is useful, while an order-two DH base is too small. Generalized CRT requires the gcd to divide each difference. The power-of-two Montgomery specialization requires odd N, R > N and the inverse-derived constant N′; the unreduced REDC candidate may still require one final subtraction. Correct mathematical refusals are informational; route disagreements and the deliberately tiny DH space are alarms.

The negative fixture uses a = 22 modulo 23: Euler, Fermat, divisibility of the order and return to one all pass, while only two shared secrets are possible. Passing a theorem’s precondition does not establish a useful cryptographic group size.

## Real-World Usage

RSA computes its private exponent using an inverse and often recombines CRT residues. [RFC 7919 Appendix A.1](https://www.rfc-editor.org/rfc/rfc7919.html#appendix-A.1) specifies FFDHE’s g = 2 and prime subgroup order q = (p−1)/2. The p = 23 examples here are arithmetic models, not deployed parameters. [Montgomery’s original 1985 paper](https://doi.org/10.1090/S0025-5718-1985-0777282-X) defines the residue representation and REDC method used in exhibit 7. Sunzi’s classical remainder problem supplies the CRT default; no historical date is asserted. Paar and Pelzl, *Understanding Cryptography* (2010), §§1.4, 6.3, 7.5.2 and 8.2 supply teaching context; no text or worked example is reproduced.

## How to Run Locally

```bash
npm ci
npm run dev
```

## Related Demos

- [Educational RSA](https://systemslibrarian.github.io/crypto-lab-rsa-educational/) — the inverse becomes d; fast exponentiation traces.
- [RSA Forge](https://systemslibrarian.github.io/crypto-lab-rsa-forge/) — Håstad’s attack and software-simulated CRT faults, both confirmed from executed source.
- [Prime Witness](https://systemslibrarian.github.io/crypto-lab-prime-witness/) — Fermat as a primality test, and its liars.
- [Log Forge](https://systemslibrarian.github.io/crypto-lab-log-forge/) — discrete-log algorithms and Pohlig–Hellman.
- [ElGamal Plain](https://systemslibrarian.github.io/crypto-lab-elgamal-plain/) — full-group versus subgroup message encoding.
- [Residue Gate](https://systemslibrarian.github.io/crypto-lab-residue-gate/) — squares and symbols.
- [DH MITM](https://systemslibrarian.github.io/crypto-lab-diffie-hellman-mitm/) — the exchange and its authentication.
- [AES Anatomy](https://systemslibrarian.github.io/crypto-lab-aes-anatomy/) — polynomial arithmetic over GF(2⁸).

## Build & Verify

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npx playwright test --retries=0
node scripts/check-mutations.mjs
```

Fifty-nine unit cases include the original exhaustive arithmetic checks plus independent Montgomery REDC calculations, every valid T for N = 17, every input pair for every odd modulus through 99, explicit raw-candidate/final-subtraction traces, both sides of the 2³⁹ radix transition, the full 10¹² modulus boundary, invalid modulus/radix combinations, conversion through R², chained multiplication and identical fixed-work schedules. The original core ranges and pinned mathematical values are unchanged.

The 38 browser claims independently recompute reductions, multiplication-row permutations, Bézout identities, inverse ranges, unit counts, power walks, every prime-factor generator check, subgroup members, DH search space and guess position, CRT inverses/substitutions, and the Montgomery trace, chain and fixed-work result. The N = 9 fixture requires raw candidate 9 followed by subtraction to 0; the negative-input fixture requires canonical result 2 and every verdict to pass. Invalid even/unit/over-budget moduli, too-small radices and non-power-of-two radices have named informational refusals. The existing negative act-4 fixture and cancellation/input-budget gates remain intact.

Two accessibility tests scan every act and example at 1280px and 320px, including Montgomery’s valid traces and refusal states, arrival before computation, reveals and the composite counterexample. They retain axe, measured contrast, focus, hidden-state and overflow gates and the existing non-text baseline.

The mutation runner requires committed source and records 38 concrete mutations, including ten Montgomery cases and the existing two-patch cancellation mutation. Before building, it proves that every mutation owner selects exactly one browser test. Each case must pass that named baseline, produce a non-empty source diff, compile and move the bundle hash, fail by an assertion, then restore the exact bundle and pass again. It rejects missing/duplicate anchors, build failures, infrastructure errors, timeouts, empty/multiple selections, skips and retries as kills. Hosted CI preserves complete JSON and per-case logs after a successful gate, or whatever partial evidence was generated by an in-loop failure; failures before artifact creation remain visible in the workflow step log.


## Performance

Heavy computations and HTML preparation run in a cancellable Worker; the page reports their measured elapsed time. The Montgomery exhibit additionally separates context/encoding setup, an ordinary 4,096-operation loop, the matching encoded loop and final decoding. The encoded loop executes the implementation’s validation and trace-object work on every operation, so its single-run values are neither a general benchmark nor a constant-time claim. Factorisation is exact trial division through 10¹², counting through 10⁶, prime-group enumeration through 10⁴, and displayed wrap/walk experiments through modulus 10⁴. Inputs above the declared budget are refused. BigInt arithmetic stays exact above 2⁵³. Large unit lists are paginated, and wide data regions are keyboard-scrollable. Subgroup construction reuses one primitive root across every divisor instead of enumerating all generators again for each subgroup.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
