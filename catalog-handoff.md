# Clock Arithmetic catalog handoff

Proposed title: Clock Arithmetic. Level: Intermediate. Categories: KEY EXCHANGE | ENCRYPTION. Add the title to FOUNDATIONS_TITLES rather than writing FOUNDATIONS into data-category. Do not add it to the Beginner-only Start Here path.

Proposed chips: Modular Arithmetic · Extended Euclid · Euler φ · CRT. The catalog pass should check the vocabulary and add missing supported terms. Proposed description: “Steps the integer arithmetic under RSA and Diffie–Hellman — inverses, φ, powers and orders, generators and subgroups, and generalized CRT — and shows each precondition failing.”

This replaces the draft recommendation to add only an extended-Euclid stepper inside Educational RSA. A later one-line link beside Educational RSA’s computation of d should lead to this lab’s inverse act. Read source and revisions are recorded in overlap-review.md. The lab supplies the vocabulary that DH MITM, Log Forge, Residue Gate and ElGamal Plain assume, without duplicating their attacks or encoding lessons.

Verification: 10 exhaustive unit tests and 20 browser tests (18 claims, 2 full state scans at 1280px and 320px) passed. Twelve concrete mutations include all eleven brief defects and a broken negative-fixture check; each produced an assertion failure after a successful changed-artifact build, then restored to the baseline artifact and a green owning test. See mutation-evidence.json. The source fixture is mathematical, not a cryptographic test-vector document. RFC 7919 Appendix A.1 was independently checked for g=2 and q=(p−1)/2.

Preview port 4747 was selected from the full committed port registry; the catalog’s complete port-sync audit could not run with only a partial fleet checkout (it correctly refused to repin the census). Preserve all existing registry entries when adding this one. AES Anatomy uses 4746.
