# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Browser-only meeting cost timer (UI in German). Plain HTML/CSS/JS, no build step, no dependencies, no persistence — state lives only in memory by design (do not add localStorage/backend).

## Running

Open `index.html` directly in a browser (works from `file://`, so scripts are classic `<script>` tags, not ES modules).

Check the pure logic in Node: `node -e 'const C=require("./calc.js"); ...'` — `calc.js` exports via `module.exports` in Node and `window.MeetingCost` in the browser.

## Architecture

- `calc.js` — pure cost/time math, no DOM. Cost per participant entry = `rate × count × active time`, where `joinedAt === null` means "since meeting start" and `leftAt === null` means "still present". Removing someone mid-meeting sets `leftAt`, so their accrued cost is kept.
- `app.js` — single `state` object (`phase: setup | running | stopped`), DOM rendering, a 50 ms `setInterval` ticker (not rAF, so it keeps updating when the window is shared/occluded). Once stopped, `now()` returns `endedAt`, so every calculation freezes.
- `style.css` — color tokens on `:root` with dark-mode overrides; `body.present` is the fullscreen presentation mode for screen sharing.
