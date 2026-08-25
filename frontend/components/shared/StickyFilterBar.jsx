"use client";

// IMPORTANT: do NOT wrap this component's root element in any extra <div>
// anywhere in the tree between it and <body>. An extra wrapper div around
// the sticky Navbar broke position:sticky site-wide (see LayoutShell.jsx —
// Navbar is forwardRef'd directly, no wrapper). The same caution applies to
// this bar: keep it a direct child render, don't nest it inside another
// plain div "for organization."
export default function StickyFilterBar({ children }) {
  return (
    <div
      data-sticky-filterbar
      className="static md:sticky z-30 bg-white"
      style={{ top: "var(--navbar-h, 0px)" }}
    >
      <div className=" mx-auto px-6 py-4">{children}</div>
    </div>
  );
}