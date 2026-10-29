# Uncle Desktop

[ภาษาไทย](README.th.md) · **English** · [Français](README.fr.md) · [Original Capri Documentation](README.upstream.md)

> [!NOTE]
> **Credit & Attribution:** This project is a customized, Thai-friendly fork developed from the wonderful [Capri Desktop](https://github.com/mochiiwuff/capri-desktop) by [mochiiwuff](https://github.com/mochiiwuff).

---

**Uncle Desktop** is an AI desktop companion living on your screen that tracks what your coding AI agent is up to (**Claude Code**, **Codex**, or **Antigravity (AGY)**), featuring selectable characters, Thai language support, and interactive animations.

![Uncle Desktop / Capri](docs/done.png)

---

## What Uncle Desktop Adds & Features

- **Thai Language Support (รองรับภาษาไทยเต็มรูปแบบ):** Default Thai UI, system tray & context menus, Chakra Petch Thai font, Thai date/time parsing, and Thai chat commands (see [docs/THAI_SUPPORT.md](docs/THAI_SUPPORT.md)).
- **Custom & Selectable Characters:** Switch between characters or import custom character packs (see [docs/CHARACTERS.md](docs/CHARACTERS.md) and [docs/ADD_YOUR_CHARACTER.md](docs/ADD_YOUR_CHARACTER.md)).
- **Real-Time Coding Agent Status:**
  - **Ticker:** Shows what your AI is doing (`EDITS file.ts`, `RUNS npm test`, `GREPS "query"`).
  - **Permission / Question Alert:** Teleports to your cursor and points to the AI's window when it needs your input.
  - **Thinking Indicator:** Keeps track when a local model or cloud AI is thinking quietly.
  - **Error & Victory Feedback:** Visual impacts on failed commands, and celebration animations with summary stats upon task completion.
- **Desktop Physics & Interactions:** Sits on window titlebars, follows active windows, reacts to cursor proximity, draggable, throwable, and supports multi-monitor setups.
- **Local / Cloud LLM Chat & Tools:** Chat directly, take screenshots, manage desktop audio, and set smart reminders.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or newer
- Windows 10/11 (window tracking & sitting features are optimized for Windows)

### Installation

```bash
# Clone the repository
git clone https://github.com/pk115/uncle-desktop.git
cd uncle-desktop

# Install dependencies
npm install

# Start the application
npm start
```

### Development & Scripts

- `npm run dev` — Start app with developer tools enabled.
- `npm run demo` — Run the character animation demo sequence.
- `npm test` — Run all unit and Thai localization tests.
- `npm run hooks:agy:install` — Install hooks for Antigravity (AGY).
- `npm run hooks:codex:install` — Install hooks for Codex.
- `npm run hooks:install` — Install hooks for Claude Code.
- `npm run dist` — Build the Windows NSIS installer.

---

## License & Credits

- Forked and inspired by [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop) (Original author: mochiiwuff).
- Maintained and customized by **TheUncleDev** ([pk115/uncle-desktop](https://github.com/pk115/uncle-desktop)).
- Licensed under [PolyForm Noncommercial 1.0.0](LICENSE).
