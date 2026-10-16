# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Browser-only meeting cost timer (UI in German). Plain HTML/CSS/JS, no build step, no dependencies, no persistence — state lives only in memory by design (do not add localStorage/backend).

## Running

Open `index.html` directly in a browser (works from `file://`, so scripts are classic `<script>` tags, not ES modules).

Check the pure logic in Node: `node -e 'const C=require("./js/calc.js"); ...'` — `calc.js` exports via `module.exports` in Node and `window.MeetingCost` in the browser.

## Architecture

- `js/calc.js` — pure cost/time math, no DOM. Cost per participant entry = `rate × count × active time`, where `joinedAt === null` means "since meeting start" and `leftAt === null` means "still present". Removing someone mid-meeting sets `leftAt`, so their accrued cost is kept.
- `js/app.js` — single `state` object (`phase: setup | running | stopped`), DOM rendering, a 50 ms `setInterval` ticker (not rAF, so it keeps updating when the window is shared/occluded). Once stopped, `now()` returns `endedAt`, so every calculation freezes.
- `js/share.js` — pure encode/decode of share links (`#s=<base64url JSON>`), exported as `window.MeetingShare`. Opening such a link sets `state.readonly` (and `state.anonymous`); the link is a snapshot, no live sync and no backend. Anonymous links replace participants with time segments (`count` = heads, `rate` = total/heads) so `calc.js` stays unchanged.
- `css/style.css` — color tokens on `:root` with dark-mode overrides; `body.present` is the fullscreen presentation mode for screen sharing.

Extend or change the README.md file every time a new feature is added or documented functionality is changed.