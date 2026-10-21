# Clock Arithmetic catalog handoff

This is a **PR-only audit remediation**, not a new deployment. The catalog repository and every neighbouring lab are unchanged.

| Field | Handoff |
|---|---|
| Brief read | `brief.md`; catalog `_MASTER-TEMPLATE.md` §§4.1a–d and kickoff handoff fields |
| Repository | `systemslibrarian/crypto-lab-clock-arithmetic` |
| Final source SHA | `d02f885786fd762ccc36f133ef26e68ca322adb6` — code, tests and mutation runner on `fix/clock-arithmetic-audit`; the following commit records this handoff and observed evidence only |
| Live URL | https://systemslibrarian.github.io/crypto-lab-clock-arithmetic/ — existing deployment; these PR changes are not live |
| Card title | Clock Arithmetic |
| Card kicker | Arithmetic Before the Cipher |
| Card copy (26 words) | Step through the integer arithmetic under RSA and Diffie–Hellman: inverses, Euler φ, powers, orders, generators, subgroups and generalized CRT. Inspect what happens when each precondition fails. |
| Exactly four chips | Modular Arithmetic · Extended Euclid · Euler φ · CRT |
| `TITLE_TO_SECTION` id | `foundations` |
| Foundations / real world | Include in `FOUNDATIONS_TITLES`; do not add to `REAL_WORLD_TITLES` |
| Category — **PROVISIONAL** | `KEY EXCHANGE \| ENCRYPTION`; FOUNDATIONS is appended at runtime, not placed in `data-category` |
| Level | `intermediate`: the reader uses algebra and modular arithmetic while the lab introduces groups; not the Beginner-only Start Here path |
| Concept coverage | **7. Factoring** (RSA arithmetic prerequisites) and **8. Discrete logarithm** (finite-field DH arithmetic prerequisites); no new factoring or discrete-log attack is claimed |
| Playwright port | **4747**, with `--strictPort`; preserve the existing registry entry |
| Accent — **PROVISIONAL** | Lab identity `--accent: #7bd389`; existing catalog card `#ffb84d`, subject to the catalog’s rotation policy |
| Favicon — **PROVISIONAL** | 🕰️ (`U+1F570 U+FE0F`, including the emoji-presentation selector) |

## Served-bytes check

Read-only check of the existing deployment during this audit:

```bash
curl -fsSL https://systemslibrarian.github.io/crypto-lab-clock-arithmetic/ -o live-before.html
python3 -c 'from pathlib import Path; import hashlib; b=Path("live-before.html").read_bytes(); print(len(b)); print(hashlib.sha256(b).hexdigest()); print(b.count(b"https://systemslibrarian.github.io/crypto-lab-point-arithmetic/")); print(b.count(b"https://systemslibrarian.github.io/crypto-lab-ec-point-arithmetic/"))'
```

Actual output (HTTP 200):

```text
8029
257e02261ae16702a75ca47593e063c5858237a7e1c6ae551d2468027db32421
1
0
```

The last two lines count the old and corrected Point Arithmetic URLs respectively. They establish that the deployed bytes still precede this PR, not that the fix shipped. After an authorized merge/deploy, repeat the check and verify the corrected URL and new asset bytes. No merge or deployment was performed for this audit.

The mutation runner recorded local source commit `ce89e60c0acc53a5d5c7a79294f9b26e1ce61dfe`. Publication re-created commit metadata through the connected GitHub account; every published source tree was checked against its tested local tree. The final source tree is `7e370e646e86b56b25575a71c9069ace001445eb` in both histories. See the identity map in `audit-verification.md`.

## Source-review note

Reviewed at the final source SHA above: all seven arithmetic modules in `src/nt/`, all six act renderers, `src/ui/clock.ts`, `src/ui/strip.ts`, `src/ui/common.ts`, the computed prediction and composite helpers, `src/main.ts`, `src/worker.ts`, the independent claims oracles, and the mutation runner. These anchors are after source expansion:

| Executed arithmetic | Implementation | Real call site |
|---|---|---|
| Canonical modular reduction, addition and multiplication | `src/nt/mod.ts:7`, `src/nt/mod.ts:20` | `src/ui/act1.ts:8`, `src/ui/act1.ts:10`, `src/ui/act1.ts:12` |
| Euclid and multiplication-row unit criterion | `src/nt/euclid.ts:3`, `src/nt/euclid.ts:10` | `src/ui/act1.ts:25`, `src/ui/act2.ts:6` |
| Extended Euclid and normalized modular inverse | `src/nt/euclid.ts:23`, `src/nt/euclid.ts:48` | `src/ui/act2.ts:7`, `src/ui/act2.ts:8`; reused by CRT at `src/nt/crt.ts:60` |
| Trial-division factorisation, Euler φ by product and by enumeration | `src/nt/phi.ts:4`, `src/nt/phi.ts:19`, `src/nt/phi.ts:25` | `src/ui/act3.ts:7`, `src/ui/act3.ts:8`, `src/ui/act3.ts:11` |
| Modular exponentiation by repeated squaring; Euler and Fermat checks | `src/nt/mod.ts:12` | `src/ui/act4.ts:15`, `src/ui/act4.ts:30`; generator powers at `src/nt/cyclic.ts:16` |
| Order by multiplication walk and divisor search | `src/nt/order.ts:5`, `src/nt/order.ts:25` | `src/ui/act4.ts:11`, `src/ui/act4.ts:12` |
| Exact trial-division prime precondition | `src/nt/phi.ts:47`, `src/nt/cyclic.ts:5` | `src/ui/act5.ts:10` |
| Generator criterion for every prime divisor of p−1; generator enumeration | `src/nt/cyclic.ts:13`, `src/nt/cyclic.ts:20` | `src/ui/act5.ts:13`, `src/ui/act5.ts:14` |
| Order-d subgroups from a reused primitive root | `src/nt/cyclic.ts:33` | `src/ui/act5.ts:31` passes `gens[0]` once found |
| Generalized CRT, compatibility and lcm modulus | `src/nt/crt.ts:31` | `src/ui/act6.ts:8` |
| Toy finite-field DH, distinct-power search space and 1-based guesses | `src/nt/toyDh.ts:26`, `src/nt/toyDh.ts:4`, `src/nt/toyDh.ts:17` | `src/ui/act5.ts:16`, `src/ui/act5.ts:15`, `src/ui/act5.ts:17` |
| ℤ₁₅* unit-order counterexample | `src/nt/phi.ts:25`, `src/nt/order.ts:25` | `src/ui/composite.ts:6` |

RSA, Håstad’s attack, software CRT-fault attacks, Pohlig–Hellman, Miller–Rabin, Jacobi/Legendre symbols, elliptic-curve arithmetic and AES/GF(2⁸) are neighbouring lessons named in prose/links, **not implementations in this lab**. Garner’s algorithm and decomposition of ℤₙ* remain extension comments, not shipped algorithms. RFC 7919 is context for prime-order subgroups; this lab does not implement an FFDHE protocol. Its prime check is exact small-number trial division, not Prime Witness’s primality-testing exhibit.

Suggested `tools/catalog-reviewed.json` note: “Reviewed hand-rolled BigInt modular operations, Euclidean/Bézout traces and normalized inverses, two φ routes, two order routes, complete prime-factor generator checks, subgroups from a shared primitive root, generalized CRT, and a toy DH that separately computes search space and actual guess position. Call sites are pinned above. Attack/protocol names in related links and the Garner/group-decomposition seams are not implemented chips.”

## GitHub metadata to set in a later catalog/metadata pass

**About (under 350 characters):** Explore the arithmetic behind RSA and finite-field Diffie–Hellman. Six browser exhibits derive modular reductions, inverses, Euler φ, orders, generators, subgroups and CRT with exact BigInt traces and explicit precondition failures.

**Topics:** `cryptography`, `crypto-lab`, `number-theory`, `modular-arithmetic`, `extended-euclidean-algorithm`, `chinese-remainder-theorem`, `diffie-hellman`, `education`, `interactive`.

## Overlap and verification

This lab supplies the vocabulary assumed by DH MITM, Log Forge, Residue Gate and ElGamal Plain without reproducing their attacks or encoding lessons. It supersedes the proposal for only an extended-Euclid stepper in Educational RSA; any future inverse-act link there belongs in a separate handoff, not this PR.

The original neighbouring source-review revisions are retained in `overlap-review.md`: Educational RSA `bc479abe82b5232b8187c9032e0fb8046e0e8f5b`; RSA Forge `fb8ce562d53d9063e9c24eb7950cae6a72109484`; Prime Witness `c85f91a26720f4f2d63b8b4471720cfcce49bb25`; Log Forge `d81c706537f4946c60b5f9dcc24f6ba2e5e3d15e`; ElGamal Plain `251bf90ef747f256d0e18f0fe987eadafa3f06da`; Residue Gate `d1f1c553da40f36f1f02b57800262271278f441a`; DH MITM `f5679cc9b202fa4ef7da14e072b75b10bc5bb695`. These are historical overlap evidence, not claims of reauditing those repositories’ latest tips.

Final observed counts, browser environment and every mutation’s five steps are in `audit-verification.md` and machine-written `mutation-evidence.json`. Grouped updates, gated Dependabot auto-merge, the PR gate and `workflow_dispatch` are present; the PR deployment job remains disabled.

**Final verification:** 10 unit + 27 claims + 2 accessibility tests passed; 0 skips/retries; **28 of 28 mutations killed**, each with all five steps. Grouping, gated auto-merge, PR gate and workflow_dispatch are present. PR only: not merged or deployed.
