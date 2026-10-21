// Render a mathematical outcome as success, information or an alarm with text and a glyph.
export function verdict(kind: 'ok' | 'info' | 'alarm', text: string, id = '') {
  return `<p ${id ? `id="${id}"` : ''} class="verdict-${kind}" data-verdict="${kind}">${kind === 'ok' ? '✓' : kind === 'alarm' ? '⚠' : 'ⓘ'} ${text}</p>`;
}
// Report whether a computed identity holds, naming a disagreement as an implementation alarm.
export function check(name: string, ok: boolean, text: string) {
  return `<p data-check="${name}" data-verdict="${ok ? 'pass' : 'fail'}" class="verdict-${ok ? 'ok' : 'alarm'}">${ok ? '✓' : '⚠'} ${text}${ok ? '' : ' — implementation disagreement'}</p>`;
}
// Render arithmetic rows with column headings inside a keyboard-scrollable region.
export function table(label: string, heads: string[], rows: string[][], cls = '') {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${label}"><table class="${cls}"><thead><tr>${heads.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
