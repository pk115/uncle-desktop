# Uncle Desktop

**0.7.0:** voice commands send automatically by default, with spoken confirmation for app closing/risky launches, yes/no follow-up and 20-second expiry. Basic actions use existing tools directly. [Voice guide](docs/VOICE_COMMANDS_TH.md).

**0.6.0 voice commands:** push-to-talk, selectable microphone, editable wake phrases, optional follow-up conversation, local Thai STT or OpenAI, transcript review and immediate mic-off. See [voice setup and test limitations](docs/VOICE_COMMANDS_TH.md). Microphone starts off each launch; local wake detection requires the optional model download.

[Current implementation status and feature roadmap from lachydotmcg (Thai)](docs/FEATURE_ROADMAP_TH.md). This Electron project already includes chat actions, character selection/import and TTS; microphone input, custom wake phrases and follow-up conversation are available in 0.6.0; lip sync and OpenCode remain planned.

**0.5.0:** Windows installer and speech settings are available. Right-click → **เสียงพูดภาษาไทย…** to use installed Windows voices or OpenAI TTS, test/stop speech, adjust rate/volume, and optionally read chat replies aloud. Windows Thai requires an installed Thai voice; OpenAI requires your API key and consent and may incur API charges. See [speech setup and validation limits](docs/SPEECH_TH.md).

[ภาษาไทย](README.th.md) · **English** · [Français](README.fr.md) · [Original Capri Documentation](README.upstream.md)

> [!NOTE]
> **Credit & Attribution:** This project is a customized, Thai-friendly fork developed from the wonderful [Capri Desktop](https://github.com/mochiiwuff/capri-desktop) by [mochiiwuff](https://github.com/mochiiwuff).

---

**Uncle Desktop** is an AI desktop companion living on your screen that tracks what your coding AI agent is up to (**Claude Code**, **Codex**, or **Antigravity (AGY)**), featuring selectable characters, Thai language support, and interactive animations.

![Uncle Desktop / Capri](docs/done.png)

---

## 🎭 Selectable Characters Gallery

Right-click the character or system tray icon and select **"Choose Character…"** to switch between 13 available characters or import your own:

| UncleDev | Blacky | Mira | Pinky |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/angry-boy/portrait.png" width="120" /> | <img src="assets/characters/blacky/portrait.png" width="120" /> | <img src="assets/characters/mira/portrait.png" width="120" /> | <img src="assets/characters/pinky/portrait.png" width="120" /> |

| Bald Man | Cute Girl | Drunk Uncle | Lazy Boy |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/bald-man/portrait.png" width="120" /> | <img src="assets/characters/cute-girl/portrait.png" width="120" /> | <img src="assets/characters/drunk-uncle/portrait.png" width="120" /> | <img src="assets/characters/lazy-boy/portrait.png" width="120" /> |

| Chubby Girl | Fatty Girl | Angry Guy | Vulture |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/chubby-girl/portrait.png" width="120" /> | <img src="assets/characters/fatty-girl/portrait.png" width="120" /> | <img src="assets/characters/angry-guy/portrait.png" width="120" /> | <img src="assets/characters/vulture/portrait.png" width="120" /> |

*(Plus the original **Capri** from Cyberpunk: Edgerunners)*  
Learn how to import and customize characters in [docs/CHARACTERS.md](docs/CHARACTERS.md) and [docs/ADD_YOUR_CHARACTER.md](docs/ADD_YOUR_CHARACTER.md).

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
- macOS (beta): download the `.dmg` and follow [the Mac install guide (Thai)](docs/INSTALL_MAC_TH.md)

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
- `npm run release` — Build and upload the installer to a draft GitHub Release (needs `GH_TOKEN`). Publish the draft and installed copies update themselves.

---

## License & Credits

- Forked and inspired by [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop) (Original author: mochiiwuff).
- Maintained and customized by **TheUncleDev** ([pk115/uncle-desktop](https://github.com/pk115/uncle-desktop)).
- Licensed under [PolyForm Noncommercial 1.0.0](LICENSE).


### 0.8.0 — Thai speech recognition

Local Thai-tuned Thonburian medium, Gemini transcription, configurable pause duration and vocabulary, and a no-action voice test with model/timing diagnostics. See [Thai voice guide](docs/VOICE_COMMANDS_TH.md).

### 0.8.1 — Updates itself, moves with her voice

Installed copies now check GitHub Releases on start and every 6 hours, download new versions quietly and install them when she quits. She also moves with her voice while she reads replies aloud. Install 0.8.1 once by hand; later versions arrive on their own.


### 0.9.0 — Computer control (Windows)

Read UI Automation targets, type Thai, click, scroll and run bounded multi-step jobs with the selected AI. Includes step status, confirmations, stop hotkey and observed-text completion checks. See [computer control guide](docs/COMPUTER_CONTROL_TH.md). Inspired by the [Capri project by Lachy](https://github.com/lachydotmcg/capri-desktop).


### 0.11.0 — Switchable ElevenLabs Voice Agent

Choose the original Local/Gemini/OpenAI voice pipeline or ElevenLabs continuous voice with interruption handling and 13 client-tool categories. Thai uses Eleven v3 Conversational. See [Thai setup and validation guide](docs/VOICE_AGENT_TH.md).


### 0.12.0 — Four new companions

Adds Mochi (pink gothic cat), Lili (anime floral elf), Luna (realistic floral elf), and Pudding (cheerful yellow casual outfit), with gallery previews, distinct personalities and six 2D pose states. Existing characters remain available.


### 0.13.0 — Setup wizard and tabbed settings

A step-by-step setup wizard on first run, a short right-click menu with the rest in a tabbed Settings dialog (with character previews), a reset-all-settings button, and she now tells you when an update is ready, with a restart button and a manual check in Settings.

### 0.12.2 — Settings, memory and fixes

One all-settings page with rebindable hotkeys, a personality.md you write and a me.md she fills in as you chat, an upper-body view, crash logging to errors.txt, and a working local model download button (broken since 0.8.0).
