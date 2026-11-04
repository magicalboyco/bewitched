// Optional externally-supplied gem artwork. Each piece type may have a
// matching assets/gems/<id>.svg; if it loads, the renderer draws it
// instead of the procedural jewel. If it 404s, is missing entirely, or
// hasn't finished loading yet, callers get null back and fall through to
// the procedural gem — nothing here ever throws or blocks rendering.
//
// No import from pieces.js on purpose (pieces.js imports getGemImage from
// here, so importing PIECE_TYPES back would make a dependency cycle) —
// callers pass the ids they want loaded instead.

const images = new Map(); // id -> HTMLImageElement | 'failed'

export function loadGemImages(ids, basePath = 'assets/gems/') {
  ids.forEach((id) => {
    if (images.has(id)) return;
    const img = new Image();
    img.onload = () => images.set(id, img);
    img.onerror = () => images.set(id, 'failed');
    img.src = `${basePath}${id}.svg`;
  });
}

export function getGemImage(id) {
  const entry = images.get(id);
  return entry && entry !== 'failed' ? entry : null;
}
