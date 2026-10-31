import { useEffect, useRef } from "react";

/**
 * Enables desktop-friendly horizontal scrolling on an element that already
 * scrolls horizontally via touch/swipe (overflow-x-auto). Adds:
 *  - vertical mouse-wheel -> horizontal scroll translation
 *  - click-and-drag panning with the mouse
 * Touch/swipe behavior is untouched since this only reacts to wheel/mouse
 * events, never touch events.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Only hijack the wheel when the scroll is predominantly vertical and
      // the element actually has horizontal overflow to scroll through.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    let isDragging = false;
    let dragStartX = 0;
    let scrollStartLeft = 0;
    let moved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isDragging = true;
      moved = false;
      dragStartX = e.clientX;
      scrollStartLeft = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 3) moved = true;
      el.scrollLeft = scrollStartLeft - delta;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    // Suppress the click that would otherwise fire on a card after a drag.
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("pointerleave", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("pointerleave", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}
