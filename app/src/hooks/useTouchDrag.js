import { useRef, useCallback, useEffect } from "react";

const LONG_PRESS_MS = 400;
const DRAG_THRESHOLD = 8;

/**
 * Hook that enables touch-based drag & drop for kanban cards.
 * Attaches to a board container ref; cards must have [data-task-id] and
 * columns must have [data-col-id].
 *
 * Usage: useTouchDrag(boardRef, onMoveTask)
 *   onMoveTask(taskId, newColId)
 */
export default function useTouchDrag(boardRef, onMoveTask) {
  const stateRef = useRef({
    active: false,
    taskId: null,
    ghost: null,
    startX: 0,
    startY: 0,
    timer: null,
    moved: false,
    originCol: null,
    lastHighlight: null,
  });

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    if (s.timer) { clearTimeout(s.timer); s.timer = null; }
    if (s.ghost) { s.ghost.remove(); s.ghost = null; }
    if (s.lastHighlight) { s.lastHighlight.classList.remove("drag-over"); s.lastHighlight = null; }
    // Remove the dim class from the original card
    if (s.taskId) {
      const orig = boardRef.current?.querySelector(`[data-task-id="${s.taskId}"]`);
      if (orig) orig.classList.remove("touch-dragging");
    }
    s.active = false;
    s.taskId = null;
    s.moved = false;
    s.originCol = null;
    document.body.classList.remove("touch-drag-active");
  }, [boardRef]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const onTouchStart = (e) => {
      // Find the closest card element
      const card = e.target.closest("[data-task-id]");
      if (!card) return;
      // Don't intercept touches on buttons, selects, inputs
      const tag = e.target.tagName;
      if (tag === "BUTTON" || tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.target.closest(".card-actions") || e.target.closest(".card-move")) return;

      const touch = e.touches[0];
      const s = stateRef.current;
      s.startX = touch.clientX;
      s.startY = touch.clientY;
      s.taskId = card.dataset.taskId;
      s.originCol = card.closest("[data-col-id]")?.dataset.colId || null;
      s.moved = false;

      // Start long-press timer
      s.timer = setTimeout(() => {
        s.active = true;
        document.body.classList.add("touch-drag-active");

        // Dim the original card
        card.classList.add("touch-dragging");

        // Create ghost element
        const rect = card.getBoundingClientRect();
        const ghost = card.cloneNode(true);
        ghost.className = "card touch-ghost";
        ghost.style.cssText = `
          position: fixed; z-index: 9999; pointer-events: none;
          width: ${rect.width}px;
          left: ${rect.left}px;
          top: ${rect.top}px;
          opacity: 0.9;
          transform: scale(1.04) rotate(1.5deg);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
          transition: none;
        `;
        document.body.appendChild(ghost);
        s.ghost = ghost;

        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(30);
      }, LONG_PRESS_MS);
    };

    const onTouchMove = (e) => {
      const s = stateRef.current;
      if (!s.taskId) return;

      const touch = e.touches[0];
      const dx = touch.clientX - s.startX;
      const dy = touch.clientY - s.startY;

      // If user moves before long press fires, cancel
      if (!s.active) {
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          clearTimeout(s.timer);
          s.timer = null;
          s.taskId = null;
        }
        return;
      }

      // Prevent scrolling while dragging
      e.preventDefault();

      // Move ghost
      if (s.ghost) {
        const rect = s.ghost.getBoundingClientRect();
        s.ghost.style.left = `${touch.clientX - rect.width / 2}px`;
        s.ghost.style.top = `${touch.clientY - rect.height / 2}px`;
      }
      s.moved = true;

      // Highlight the column under the touch point
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el?.closest("[data-col-id]");
      if (s.lastHighlight && s.lastHighlight !== col) {
        s.lastHighlight.classList.remove("drag-over");
      }
      if (col) {
        col.classList.add("drag-over");
        s.lastHighlight = col;
      }
    };

    const onTouchEnd = () => {
      const s = stateRef.current;
      if (!s.active || !s.taskId) {
        cleanup();
        return;
      }

      // Find which column the ghost ended on
      if (s.ghost) {
        const ghostRect = s.ghost.getBoundingClientRect();
        const cx = ghostRect.left + ghostRect.width / 2;
        const cy = ghostRect.top + ghostRect.height / 2;

        // Temporarily hide ghost so elementFromPoint hits the column behind
        s.ghost.style.display = "none";
        const el = document.elementFromPoint(cx, cy);
        s.ghost.style.display = "";

        const col = el?.closest("[data-col-id]");
        if (col && col.dataset.colId !== s.originCol) {
          onMoveTask(s.taskId, col.dataset.colId);
        }
      }

      cleanup();
    };

    const onTouchCancel = () => cleanup();

    board.addEventListener("touchstart", onTouchStart, { passive: true });
    board.addEventListener("touchmove", onTouchMove, { passive: false });
    board.addEventListener("touchend", onTouchEnd);
    board.addEventListener("touchcancel", onTouchCancel);

    return () => {
      board.removeEventListener("touchstart", onTouchStart);
      board.removeEventListener("touchmove", onTouchMove);
      board.removeEventListener("touchend", onTouchEnd);
      board.removeEventListener("touchcancel", onTouchCancel);
      cleanup();
    };
  }, [boardRef, onMoveTask, cleanup]);
}
