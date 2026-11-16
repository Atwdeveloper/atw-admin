"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 4;
const EDGE = 8;

// Dropdown for a table row's "more actions" (⋮) button.
//
// Row menus used to be absolutely positioned inside the table card, whose
// overflow-hidden / overflow-x-auto clipped them whenever there were only a
// few rows. This renders the menu into <body> instead, fixed to the button's
// on-screen position: below it when there's room, otherwise above it, and
// kept inside the viewport horizontally.
//
// Drop it in where the menu <div> used to be, inside the button's
// `relative inline-block action-menu-container` wrapper. It carries the
// `action-menu-container` class itself, so the pages' existing outside-click
// handlers (event.target.closest(".action-menu-container")) treat clicks in
// the menu as inside it.
const ActionMenuPortal = ({ children, className = "" }) => {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const anchor = anchorRef.current?.parentElement;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const r = anchor.getBoundingClientRect();
    const { offsetHeight: h, offsetWidth: w } = menu;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < h + GAP + EDGE && r.top > spaceBelow;
    const top = openUp ? Math.max(EDGE, r.top - h - GAP) : r.bottom + GAP;
    const left = Math.max(EDGE, Math.min(r.right - w, window.innerWidth - w - EDGE));
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    place();
    // Follow the button while the page or the table scrolls.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [place]);

  return (
    <>
      <span ref={anchorRef} hidden />
      {typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className={`action-menu-container fixed z-50 ${className}`}
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              // Measured on the first pass, shown once positioned.
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
};

export default ActionMenuPortal;
