export interface WalkTrace {
  id: string;
  closesAtOne: boolean;
  repeated: bigint;
}

// Place residues on a ring; draw directed powers outside it, closing only a return to 1.
export function clock(n: bigint, walk: bigint[] = [], trace?: WalkTrace): string {
  const N = Number(n),
    center = 180,
    radius = 112;
  // Convert residue angles to SVG positions without doing number-theory arithmetic in Number.
  const point = (angle: number, r: number) => ({
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  });
  const angles = Array.from({ length: N }, (_, i) => (i * 2 * Math.PI) / N - Math.PI / 2);
  const points = angles.map((angle) => point(angle, radius));
  const marker = `arrow-${trace?.id ?? 'residues'}`;
  const vertices = trace ? (trace.closesAtOne ? [1n, ...walk] : [...walk, trace.repeated]) : [];
  const edges = vertices
    .slice(1)
    .map((to, i) => {
      const from = vertices[i];
      const repeated = !trace!.closesAtOne && i === vertices.length - 2;
      // Follow the shortest outer arc, with separated radial lanes for overlapping edges.
      const start = angles[Number(from)] - (from === to ? 0.12 : 0);
      const end = angles[Number(to)] + (from === to ? 0.12 : 0);
      let delta = end - start;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      const outer = 142 + (i % 4) * 7;
      const a = point(start, radius + 16),
        b = point(end, radius + 16);
      const A = point(start, outer),
        B = point(start + delta, outer);
      const label = point(start + delta / 2, outer + 9);
      return `<path data-edge="${repeated ? 'repeat' : 'step'}" data-from="${from}" data-to="${to}" data-step="${i + 1}" d="M ${a.x} ${a.y} L ${A.x} ${A.y} A ${outer} ${outer} 0 0 ${delta >= 0 ? 1 : 0} ${B.x} ${B.y} L ${b.x} ${b.y}" fill="none" stroke="var(--accent)" stroke-width="2"${repeated ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#${marker})"/>${repeated ? `<text data-cycle-label x="${label.x}" y="${label.y}" text-anchor="middle" fill="#edf6ef" font-size="12">cycle</text>` : ''}`;
    })
    .join('');
  return `<svg class="clock" viewBox="0 0 360 360" role="img" data-closed="${trace?.closesAtOne ?? false}" aria-label="Clock of ${n} residues${trace ? (trace.closesAtOne ? ', closed directed power walk through 1' : ', open directed power walk with dashed cycle edge; never reaches 1') : ', highlighted residues'}">
    <defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/></marker></defs>
    ${edges}
    ${points
      .map((p, i) => {
        const visited = walk.includes(BigInt(i));
        return `<circle data-residue="${i}" data-visited="${visited}" cx="${p.x}" cy="${p.y}" r="13" fill="${visited ? '#244d36' : '#172820'}" stroke="#8ba99a" stroke-width="${visited ? 4 : 1}"/><text x="${p.x}" y="${p.y + 4}" text-anchor="middle" fill="#edf6ef" font-size="12">${i}</text>`;
      })
      .join('')}
  </svg><p class="clock-key">Thick rings mark visited residues.${trace ? ' Arrowheads show each multiplication step; a dashed edge marks a repeating cycle.' : ''}</p>`;
}
