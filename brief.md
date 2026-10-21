# Build brief — `crypto-lab-clock-arithmetic`

**2026-10-21. Brief only; no repository exists yet.** Written against
`audits/_MASTER-TEMPLATE.md` and `audits/kickoff.md` at catalog `88f75e7edc6f`. Paste this
file into the new repo as `./brief.md`.

Source of the gap: Paar & Pelzl, *Understanding Cryptography* (1st ed., 2010), checked against
the book's text:

- §§1.4.1–1.4.2: modular arithmetic and integer rings;
- §§6.3.1–6.3.4: Euclid, extended Euclid, Euler's φ, and Fermat and Euler;
- §7.5.2: the CRT as used in RSA;
- §§8.2.1–8.2.3: groups, cyclic groups, subgroups and Lagrange.

The catalog's draft gap check (`draft/understanding-cryptography-2e`, rank 2) proposed only an
extended-Euclid stepper inside Educational RSA. **This lab supersedes that recommendation.**
Build the derivation once, here, and give Educational RSA a link at the point where it computes
d. That link is a one-line handoff item, not part of this build.

**Verdict: new repository.**

```
NEW DEMO BRIEF
- Repo name:         crypto-lab-clock-arithmetic
- Short name (H1):   Clock Arithmetic
- Subtitle:          ℤₙ · Extended Euclid · Euler φ · Cyclic Groups · CRT
- One-liner:         Steps the integer arithmetic under RSA and Diffie–Hellman — remainders,
                     inverses by extended Euclid, Euler's φ, powers that cycle, generators and
                     subgroups, and the Chinese remainder theorem — and shows each one
                     failing when its precondition fails.
- Concept to teach:  Public-key cryptography runs on numbers that wrap around. Five moves —
                     reduce, invert, count, cycle, recombine — each work only under one
                     precondition, and many of RSA's and DH's parameter rules are exactly
                     those preconditions.
- Primitives/spec:   number theory, no standard; BigInt arithmetic, hand-rolled and
                     inspectable; Sunzi's remainder problem as the CRT's classical anchor
- Accent (--accent): #7bd389  (lab identity colour; the CARD accent is picked from the
                     CLAUDE.md four-colour rotation when the lab is carded)
- Favicon emoji:     U+1F570 U+FE0F MANTELPIECE CLOCK (with the emoji-presentation selector;
                     U+1F570 alone renders as text in some fonts)
- In scope:          ℤₙ addition and multiplication tables; Euclid and extended Euclid with
                     Bézout checks; modular inverses and when they fail; φ(n) by counting and
                     by factorisation; orders, Fermat and Euler; generators and subgroups of
                     ℤₚ*, with a toy-DH order-2 base break; CRT for two or three congruences,
                     including incompatible and non-coprime cases
- Non-goals:         primality testing (Prime Witness); fast exponentiation traces
                     (Educational RSA); discrete-log algorithms and Pohlig–Hellman (Log
                     Forge); quadratic residues, Jacobi symbols and subgroup-versus-full-group
                     encoding (Residue Gate, ElGamal Plain); GF(2^m) polynomial arithmetic
                     (AES Anatomy, same batch); elliptic-curve groups (Point Arithmetic); RSA
                     itself
```

Supplementary fields, as in the catalog's `audits/BRIEF-*.md`. They are **PROVISIONAL** per
kickoff; the catalog pass decides them.

- **data-category:** `KEY EXCHANGE | ENCRYPTION`, plus the title in `FOUNDATIONS_TITLES`.
  FOUNDATIONS is appended at runtime and never goes in `data-category`, per CLAUDE.md. Point
  Arithmetic is the precedent (`KEY EXCHANGE | SIGNATURES` plus FOUNDATIONS).
- **Level:** **Intermediate.** `LEVELS-REVIEW.md:9–11` defines Beginner as "no maths beyond
  arithmetic", Intermediate as "comfortable with algebra and basic modular arithmetic", and
  Advanced as expecting groups and fields. This lab teaches modular arithmetic and introduces
  groups on its main route, so it is not a Beginner lab. **It does not qualify for Start Here**:
  that path is Beginner-only, and its DH step deliberately has "no modulus, no exponent".

Give every non-goal its one-line "what this isn't" note in the UI (template §1 SCOPE).

## Overlap check — what I read, what a reviewer added, and what you must open

Read at the commits shown, or reported by the independent reviewer from the catalog files.
**Open every one from source before building** (kickoff rule).

- **Educational RSA** `bc479ab`. `src/rsa/bigint-math.ts` has `egcd`, `modinv` and
  `modexpTraced`. Extended Euclid runs **internally only**; the visible trace is modular
  exponentiation. Håstad's broadcast attack is in its README prose only, and its own
  `src/ui/related.ts:18` sends readers to RSA Forge for it.
- **RSA Forge.** Its README at `main` describes Håstad's broadcast attack and an
  "Implementation Pitfalls" tab that factors a key from a software-simulated CRT fault. Its
  catalog card does not yet list the fault. Confirm both from source before linking.
- **Prime Witness** `c85f91a`. Fermat and Miller–Rabin as **primality tests**, with liars and
  Carmichael numbers. This lab uses Fermat's theorem as a fact about cycles, never as a test.
- **Log Forge** `d81c706`. Discrete-log algorithms, with Pohlig–Hellman using CRT and subgroup
  structure *as an attack*.
- **ElGamal Plain.** Has a commissioned Katz–Lindell extension (gap-check ledger): "quadratic-
  character leakage, full-group versus subgroup encoding, Euler-criterion distinguisher". **That
  is the security lesson about full-group generators**, and this lab must not re-teach it. Act 5
  states the arithmetic fact and links there.
- **Residue Gate** (squares, Jacobi) and **DH MITM** (finite-field DH arithmetic; its chip is
  "Modular Arithmetic") — open both. Record in your report why act 5 does not duplicate them.
  This lab is the vocabulary those labs assume: orders, generators, subgroup sizes.
- **Agreeing in Public is not a neighbour for this lab.** Its card says it runs "one real X25519
  exchange … No modulus, no exponent". Don't link it as a place where generators are used.

## SCOPE — six acts

Every act has the same shape:

- a 2–4 sentence plain-language card;
- a **predict prompt**;
- the computation.

The defaults below are original to this brief, except Sunzi's classical problem in act 6. Use
none of the book's worked examples.

**Orientation, fixed everywhere:** `egcd(a, n)` returns `(g, s, t)` with **s·a + t·n = g**, and
**a⁻¹ mod n = s mod n**, always printed in [0, n).

1. **Wrap-around.**
   - A clock face for 2 ≤ n ≤ 24, drawn as n discrete points. ℤₙ is genuinely cyclic, so the
     circle is honest.
   - **Above 24, the clock is replaced by a residue strip**: a row of chips, one per residue,
     wrapping onto lines, used the same way in acts 4 and 5.
   - Full addition and multiplication tables for n ≤ 13.
   - Typed values are reduced and the reduction is shown (−3 mod 10 = 7, 47 mod 10 = 7).
   - **Predict:** "Is 6 · 5 mod 10 zero? Can two non-zero numbers multiply to zero here?"
2. **Undoing multiplication — gcd and inverses.**
   - In the multiplication table, a row is a permutation exactly when gcd(a, n) = 1. Mark the
     rows that repeat values; those have no inverse.
   - Euclid, stepped. Then extended Euclid as a table of (q, r, s, t), where each row carries
     its **Bézout check** s·a + t·n = r, computed on screen.
   - **Defaults:**
     - gcd(391, 299) = 23 in three rows;
     - 7⁻¹ mod 40 = **23**, from 1 = (−17)·7 + 3·40, so s = −17 and −17 mod 40 = 23.
   - **Break it:** a = 6, n = 15 → gcd 3, so no inverse. The page names the shared factor and
     notes: "this is why RSA requires gcd(e, φ(n)) = 1".
   - **Predict:** "Does 6 have an inverse mod 15?"
3. **Counting the invertible ones — φ(n).**
   - List the units of ℤₙ and count them, compute φ(n) from the factorisation
     Π pᵉ⁻¹(p − 1), and show the two agree.
   - **Defaults:** φ(36) = 12, φ(97) = 96, φ(100) = 40.
   - **Predict:** "How many of 1…36 share no factor with 36?"
4. **Powers cycle — Fermat and Euler.**
   - Draw a, a², a³, … mod n as a walk on the clock (or the residue strip) until it returns to
     1. Its length is the order of a.
   - **Lagrange, visible:** the order always divides φ(n).
   - Euler: a^φ(n) ≡ 1 when gcd(a, n) = 1, with Fermat as the prime case.
   - **Default, on the clock:** n = 20, a = 3. The walk is 3, 9, 7, 1, so the order is **4**,
     which divides φ(20) = 8, and 3⁸ ≡ 1.
   - **Second example, on the residue strip:** the order of 7 mod 100 is 4, which divides
     φ(100) = 40.
   - **Break it:** with gcd(a, n) ≠ 1 the walk never returns to 1. For 2 mod 10 it cycles 2, 4,
     8, 6 forever, and Euler's identity fails (2⁴ ≡ 6 mod 10).
   - Fast exponentiation lives behind a disclosure that links to Educational RSA's trace; don't
     rebuild it.
   - **Predict:** "Will 2's walk mod 10 ever reach 1?"
5. **Generators and subgroups.**
   - Work in ℤₚ* for a small prime p, defaulting to p = 23: |ℤ₂₃*| = 22 = 2 · 11.
   - Show every element's order (always 1, 2, 11 or 22), and the **generators**: 5, 7, 10, 11,
     14, 15, 17, 19, 20 and 21. That is ten of them, φ(22).
   - Show the subgroup of each order d | 22.
     - **⟨2⟩ has order 11, the prime (p − 1)/2.** Say plainly that **this is the kind of base
       real finite-field Diffie–Hellman uses**: RFC 7919's FFDHE groups take g = 2 generating
       the subgroup of prime order q = (p − 1)/2. Being "not a generator of the whole group" is
       not a weakness.
     - Why deployed groups prefer the prime-order subgroup over a full-group generator is
       ElGamal Plain's lesson (its commissioned extension). Link it; don't teach it.
   - **Composite counterexample:** φ(15) = 8, but no element of ℤ₁₅* has order above 4, so not
     every ℤₙ* has a generator.
   - **Break it — a toy Diffie–Hellman with a base of order 2:**
     - With p = 23 and g = 22, every shared secret is 1 or 22.
     - The page reports the **search space |⟨g⟩| = 2** separately from the guesses used. With
       g = 22 the secret is 1 for most exponent pairs, so a search from g⁰ often succeeds at
       once.
     - Contrast g = 2: search space 11, a prime. Contrast g = 5: search space 22.
     - Real groups make the order a large prime precisely so this space is enormous.
     - Link Log Forge (Pohlig–Hellman, for when the order has small factors), DH MITM, and
       Twist Trap.
   - Above p = 24 the act uses the residue strip.
   - **Predict:** "How many possible shared secrets does base 22 allow?"
6. **Recombining — the Chinese remainder theorem.**
   - Combine two or three congruences into one, stepping the constructive formula. It reuses
     act 2's inverses, so link back.
   - Show the ℤ₁₅ ↔ ℤ₃ × ℤ₅ grid as the CRT bijection.
   - **Default:** Sunzi's problem: x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 2 (mod 7) → x = 23
     (mod 105).
   - **Fail-closed:**
     - x ≡ 1 (mod 4), x ≡ 2 (mod 6) has **no solution**: gcd 2 does not divide 2 − 1. Show the
       parity clash.
     - x ≡ 1 (mod 4), x ≡ 3 (mod 6) gives x = 9 (mod 12). Its modulus is the lcm, not the
       product.
   - Link RSA Forge for Håstad's broadcast attack, which is CRT plus a cube root. Link its CRT
     fault tab only once it is confirmed from source.
   - **Predict:** "Is there a number that is 1 mod 4 and 2 mod 6?"

## SECURITY / CORRECTNESS INVARIANTS

1. **BigInt throughout.** No `Number` arithmetic on values that can exceed 2⁵³. A test asserts
   the arithmetic modules have `bigint` signatures only.
2. **Every printed inverse is verified on the page**: a · a⁻¹ mod n = 1 is shown beside it, and
   every printed inverse lies in [0, n).
3. **Every extended-Euclid row satisfies its Bézout identity**, checked as the row is drawn. A
   failing row is an ALARM, never silently printed.
4. **Two routes wherever both are feasible.**
   - φ by counting must equal φ by formula for n ≤ 10⁶. Above that only the formula route
     runs, and the page labels it "single route (factorisation)".
   - Orders by walking must equal orders found among the divisors of φ.
   - Any disagreement is an ALARM.
5. **The generator test is the real one.** g generates ℤₚ* if and only if g^((p−1)/q) ≠ 1 for
   **every** prime q | p − 1, and the page shows each q's check.
6. **Bounded inputs are refused, never clamped.**
   - n ≥ 2.
   - For factorisation-based φ, n ≤ 10¹², using trial division within the time budget.
   - For act 5, p must be prime (checked by trial division, and stated) and ≤ 10⁴.

## ARCHITECTURE

- `src/nt/mod.ts`: `mod`, `tables(n)`.
- `src/nt/euclid.ts`: `gcdSteps`, `egcdTable(a, n)` (rows of q, r, s, t, each with its Bézout
  value, in the fixed orientation), `inverse(a, n)`.
- `src/nt/phi.ts`: `phiByCount`, `phiByFactor`, `factor`.
- `src/nt/order.ts`: `orderByWalk`, `orderByDivisors`.
- `src/nt/cyclic.ts`: `isGenerator` (invariant 5), `generators`, `subgroup(d)`.
- `src/nt/crt.ts`: `crt(congruences)`, which returns a solution modulo the lcm or a typed
  `NoSolution` with its reason.
- `src/nt/toyDh.ts`: `searchSpace(g, p)` (= |⟨g⟩|, by enumeration) and `guess(secret, g, p)`
  (returns the guesses used). These are kept separate on purpose.
- `src/ui/clock.ts` (n ≤ 24) and `src/ui/strip.ts` (n > 24).
- `src/ui/act1.ts` … `src/ui/act6.ts`.
- `// [extension] point`:
  - in `cyclic.ts`, a ℤₙ* structure view (ℤ₁₅* ≅ ℤ₂ × ℤ₄);
  - in `crt.ts`, Garner's algorithm.

## UI

- A six-act stepper. The clock face (or the residue strip) is the shared visual in acts 1, 4
  and 5.
- Each act has one number-input row plus "use the example". Each result region is
  `role="status"` with `aria-live="polite"`.
- Tables wider than the viewport go in labelled scroll regions (`tabindex="0"`,
  `role="region"`, `aria-label`) per §4.2.
- Predict-then-reveal on **every** act (see SCOPE).
- Each edge case below gets a tooltip that teaches it (template §1).
- Stacks below 640px and works at 320px.

## VISUAL SEMANTICS

- Verified identities (a Bézout row, a·a⁻¹ = 1, the two φ routes agreeing) read OK, with an icon
  and text.
- **No inverse**, **no solution** and **not a generator** are **neutral facts**, not alarms.
  Each is the correct answer to the question asked. Use an informational style, e.g. "ⓘ no
  inverse: gcd(6, 15) = 3". **⟨2⟩ being a proper subgroup is especially not an alarm.**
- **Act 5's order-2 break** is ALARM: "⚠ base 22 has order 2 — only 2 possible shared secrets".
- **The §4.1d fixture** reads `EULER HOLDS — AND THE CYCLE HAS LENGTH 2` (see below).
- When two routes disagree (invariants 3 and 4), that is ALARM, and it names the implementation
  as the suspect.
- A power walk that never reaches 1 is drawn as an open path ending in its cycle, never as a
  closed loop.

## EDGE CASES

- n < 2 → refuse: "ℤ₁ has one element; nothing wraps".
- A negative or oversized a → reduce it and say so. This is not an error.
- `inverse(0, n)` → no inverse (gcd = n).
- n = 1 in the CRT → refuse. A repeated congruence → deduplicate, with a note. The same modulus
  twice with different residues → no solution.
- Act 5 with a non-prime p → refuse the generator search, and point to act 4 and the ℤ₁₅*
  example.
- A large prime factor of p − 1 → still exact. Invariant 5 needs only the factors of p − 1.
- n above 10⁶ in act 3 → the single-route label (invariant 4).
- Changing n or p retires every dependent result, and says so. Re-entering the same value
  retires nothing.

## EXTENSION SEAMS

1. A ℤₙ* structure view that decomposes it as a product of cyclic groups. Not built.
2. Garner's mixed-radix CRT, the form RSA-CRT implementations use. Not built.
3. Lifting to polynomial rings: hand it to AES Anatomy's GF(2⁸) act instead.

## Acceptance checks (write these as tests; expected values are mathematical facts, not code output)

**Pinned facts (unit, Vitest).** The brief author and an independent reviewer each verified
these by separate computations:

| Check | Expected |
|---|---|
| Euclid rows for (391, 299) | 391 = 1·299 + 92; 299 = 3·92 + 23; 92 = 4·23 + 0; gcd 23 |
| egcd(391, 299) | (23, −3, 4): 23 = (−3)·391 + 4·299 |
| egcd(7, 40) | (1, −17, 3): 1 = (−17)·7 + 3·40, so 7⁻¹ mod 40 = 23 |
| egcd(6, 15) | gcd 3 → no inverse of 6 mod 15 |
| egcd(4, 10) | gcd 2 → no inverse of 4 mod 10 |
| φ(36), φ(97), φ(100), φ(15), φ(20), φ(23) | 12, 96, 40, 8, 8, 22 |
| walk of 3 mod 20; 3⁸ mod 20 | 3, 9, 7, 1 (order 4); 1 |
| order of 7 mod 100; 7⁴⁰ mod 100 | 4; 1 |
| 2⁴ mod 10 (Euler fails, gcd ≠ 1) | 6 |
| element orders in ℤ₂₃* | exactly {1, 2, 11, 22} |
| generators of ℤ₂₃* | 5, 7, 10, 11, 14, 15, 17, 19, 20, 21 (10 = φ(22)) |
| ⟨2⟩ in ℤ₂₃* | {1, 2, 3, 4, 6, 8, 9, 12, 13, 16, 18} (order 11) |
| ⟨22⟩ in ℤ₂₃* | {1, 22} (order 2) |
| orders in ℤ₁₅* | 1→1, 2→4, 4→2, 7→4, 8→4, 11→2, 13→4, 14→2 (max 4 < φ = 8) |
| Sunzi | x = 23 (mod 105) |
| x ≡ 1 (4), x ≡ 2 (6) | no solution |
| x ≡ 1 (4), x ≡ 3 (6) | x = 9 (mod 12) |

**Independent routes (unit):**

- the inverse by extended Euclid, against brute force (n ≤ 1000), against a^(φ(n)−1) mod n
  (Euler), on all units;
- φ by counting against φ by formula, for n ≤ 2000;
- the order by walking against the order by divisors;
- `isGenerator` against "order = p − 1", for all p < 500;
- the CRT result against brute search modulo the lcm, for every pair of moduli ≤ 30;
- `searchSpace(g, p)` against `orderByWalk(g, p)`.

**Claims (`e2e/claims.spec.ts`, §4.1b):**

- **Act 2:** parse every printed (q, r, s, t) row, recompute s·a + t·n in the test, and assert
  it equals r and the page's ✓. Also assert that the printed inverse lies in [0, n) and that the
  test's own a·inv mod n is 1.
- **Act 3:** the drawn unit cells, counted, equal the printed φ, which equals the printed
  formula's value.
- **Act 5:**
  - the elements drawn as "generator" are as many as the printed count, which equals φ(p−1)
    recomputed in the test;
  - each drawn subgroup's size divides p − 1;
  - **the toy-DH search space equals |⟨g⟩| recomputed in the test for g = 22 (2), g = 2 (11)
    and g = 5 (22)**.
- **Act 6:** substitute the printed x into every congruence on screen, and assert that the
  printed modulus is the lcm.
- Every verdict asserts both its `data-verdict` and its class.
- Retirement and the no-op guard on changes to n and p.
- The `[hidden]` probe (§4.1b): no element carrying `hidden` is rendered.

**§4.1c mutations — one per rendered verdict; break the mathematics, never a flag.**

- Record each as a concrete patch (file, unique anchor, replacement) in
  `scripts/check-mutations.mjs`, in the shape of
  `crypto-lab-aes-modes/scripts/check-ofb-mutations.mjs`.
- That script writes `mutation-evidence.json`.

| # | Mutation | Killed by |
|---|---|---|
| 1 | extended Euclid updates `s` with `+` instead of `−` | the act-2 Bézout claims |
| 2 | `inverse` returns `s` unreduced (−17 for 7 mod 40) | the [0, n) claim |
| 3 | `phiByFactor` multiplies by p instead of p − 1 | the count-versus-formula claim |
| 4 | `orderByWalk` returns φ(n) without walking | the ℤ₁₅* and ⟨2⟩ facts |
| 5 | `isGenerator` checks only q = 2 | 22 joins the generator list → the generator facts and the act-5 count claim |
| 6 | `crt` skips the gcd-divides-difference check | the no-solution test, because it prints a wrong x |
| 7 | `crt` returns the product of the moduli instead of the lcm | the lcm-modulus claim (x = 9 mod 12, not mod 24) |
| 8 | `searchSpace` returns a hard-coded 2 | the claims test at g = 2 and g = 5 |
| 9 | the "no inverse" verdict tests gcd(a, n) > 2 instead of > 1 | the egcd(4, 10) test (gcd 2), which then prints an "inverse". egcd(6, 15) has gcd 3 and would not kill it |
| 10 | the Euler-identity verdict compares with a^(n−1) instead of a^φ(n) | the 3 mod 20 fact (3¹⁹ mod 20 ≠ 1) |
| 11 | delete the act-4 negative-claim sentence | §4.1d assertion 3 |

**§4.1d negative claim:** *"Euler's identity holding for a base says nothing about how long its
cycle is: a^(p−1) ≡ 1 holds for every non-zero a modulo a prime, including a base whose cycle
has length 2."*

- **Fixture:** act 4 with n = 23 and a = 22. Assertion 2 reads exactly these rendered verdicts,
  each reporting success:
  - Euler's identity 22²² ≡ 1 ✓;
  - Fermat's (same) ✓;
  - "order divides φ(23) = 22" ✓;
  - "walk returned to 1" ✓.
- The property violated, shown in the same state, is that the cycle is {1, 22}, of length 2. A
  Diffie–Hellman base with that cycle allows only two shared secrets.
- The verdict reads **`EULER HOLDS — AND THE CYCLE HAS LENGTH 2`**, with the sentence visible.
- This fixture lives in act 4 **on purpose**. Act 5's per-q generator test (invariant 5) would
  catch the property, which is the mechanism working, not its limit.
- Assert all three §4.1d points. Breaking the Euler-identity check inside the fixture makes
  assertion 2 fail; deleting the sentence makes assertion 3 fail.

**Fail-closed paths, each a NAMED test:**

- n < 2;
- an inverse with gcd > 1;
- the inverse of 0;
- φ out of budget;
- the single-route label above 10⁶;
- a non-prime p in act 5;
- an incompatible CRT;
- a repeated modulus with different residues;
- invalid input text;
- changing n mid-computation.

## Hero copy (keep the three roles distinct)

- **Subtitle:** `ℤₙ · Extended Euclid · Euler φ · Cyclic Groups · CRT`.
- **Description:** "Work through the arithmetic underneath RSA and Diffie–Hellman — inverses,
  φ, cycles, generators and the Chinese remainder theorem — and watch each one fail when its
  precondition does."
- **Why it matters:** "An RSA key needs an inverse that exists. A Diffie–Hellman base needs an
  order that is a large prime. Fast RSA decryption recombines two remainders. When one of
  those preconditions slips, the attack is usually this page's arithmetic run backwards."

## README, card and links

- README per §5, with **Exhibits** numbered 1–6.
- **Catalog handoff (do not edit `../crypto-lab`):**
  - proposed chips: `Modular Arithmetic` · `Extended Euclid` · `Euler φ` · `CRT`. Check each
    against `tools/catalog-vocab.js` and propose missing terms;
  - the PROVISIONAL `data-category` and level above;
  - the Educational RSA one-line link (see the top of this brief).
- **Links out:**
  - Educational RSA, where the inverse becomes d;
  - RSA Forge, for Håstad, and the CRT fault once confirmed;
  - Prime Witness, where Fermat becomes a test and lies;
  - Log Forge, where small subgroup orders become an attack;
  - ElGamal Plain, for full-group versus prime-order-subgroup encoding;
  - Residue Gate, for the subgroup of squares;
  - DH MITM, for finite-field DH itself;
  - AES Anatomy, for the same moves over GF(2⁸).

## Sources

- Paar & Pelzl, *Understanding Cryptography* (1st ed., 2010), §§1.4, 6.3, 7.5.2 and 8.2.
  Teaching context only; reproduce no text, examples or exercises.
- RFC 7919, Appendix A.1 (FFDHE groups: "g = 2", "The group size is: q = (p-1)/2"), as quoted
  by the independent reviewer. **Confirm against rfc-editor.org** before the page cites it.
- Sunzi's remainder problem (*Sunzi Suanjing*), for act 6's default. **Confirm the dating
  against a history-of-mathematics source before printing one**; the brief author did not
  verify a date.
- `LEVELS-REVIEW.md:9–11` (catalog), for the level definitions.
- Every pinned value above was checked by two independent computations. These are
  mathematical facts and no external vector source applies, so say so in the README's Build &
  Verify section rather than crediting a document.
