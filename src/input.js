export function attachInput(canvas, board, renderer, { onInvalidSwap } = {}) {
  let dragStart = null; // {row, col}
  let dragHandled = false;

  const cellFromEvent = (evt) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    const col = Math.floor(x / renderer.cellSize);
    const row = Math.floor(y / renderer.cellSize);
    if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) return null;
    return { row, col };
  };

  const attemptSwap = async (a, b) => {
    const ok = await board.trySwap(a, b);
    if (!ok && onInvalidSwap) onInvalidSwap();
  };

  const pointerDown = (evt) => {
    if (board.busy) return;
    const cell = cellFromEvent(evt);
    if (!cell) return;
    dragHandled = false;

    if (board.selected) {
      const sel = board.selected;
      if (sel.row === cell.row && sel.col === cell.col) {
        board.selected = null;
        dragStart = null;
        return;
      }
      if (board.isAdjacent(sel, cell)) {
        board.selected = null;
        dragStart = null;
        dragHandled = true;
        attemptSwap(sel, cell);
        return;
      }
    }
    board.selected = cell;
    dragStart = cell;
  };

  const pointerMove = (evt) => {
    if (!dragStart || dragHandled || board.busy) return;
    const cell = cellFromEvent(evt);
    if (!cell) return;
    if (cell.row === dragStart.row && cell.col === dragStart.col) return;
    if (board.isAdjacent(dragStart, cell)) {
      dragHandled = true;
      board.selected = null;
      attemptSwap(dragStart, cell);
      dragStart = null;
    }
  };

  const pointerUp = () => {
    dragStart = null;
  };

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);

  return () => {
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
  };
}