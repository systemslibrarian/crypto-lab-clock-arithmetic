# Source overlap review

- `rsa-educational` at `bc479abe82b5232b8187c9032e0fb8046e0e8f5b`.
- `rsa-forge` at `fb8ce562d53d9063e9c24eb7950cae6a72109484`.
- `prime-witness` at `c85f91a26720f4f2d63b8b4471720cfcce49bb25`.
- `log-forge` at `d81c706537f4946c60b5f9dcc24f6ba2e5e3d15e`.
- `elgamal-plain` at `251bf90ef747f256d0e18f0fe987eadafa3f06da`.
- `residue-gate` at `d1f1c553da40f36f1f02b57800262271278f441a`.
- `diffie-hellman-mitm` at `f5679cc9b202fa4ef7da14e072b75b10bc5bb695`.

Read Educational RSA bigint-math.ts (internal egcd; visible modexp trace), RSA Forge attacks.ts crt3 and Håstad handlers plus pitfalls.ts/crtSign and fault panel, Prime Witness fermat.ts (primality evidence), Log Forge dlog/pohlig.ts (digit attack and CRT), ElGamal Plain fullGroupBroken.ts and qrGame.ts (executed quadratic-character distinguisher and encoding), Residue Gate legendre.ts/jacobi.ts (symbols), and DH MITM engine.ts (exchange, BSGS and authentication). Clock Arithmetic derives the vocabulary: inverse rows, orders, generator checks and generalized CRT. It does not implement those attacks, symbols or encoding lessons. RSA Forge’s CRT fault is confirmed from executed source.
