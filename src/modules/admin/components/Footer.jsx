"use client";

import React from "react";

// Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-white border-t py-3 px-6 absolute bottom-0 w-full left-0">
      <div className="text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Anytime Work. All rights reserved. |
        Developed by{" "}
        <a
          href="https://www.logicspice.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium ml-1"
        >
          LogicSpice
        </a>
      </div>
    </footer>
  );
}
