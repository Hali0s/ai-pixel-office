# AI Pixel Office

**A living pixel-art office where your AI agents come to life as animated characters.**

Built for [Claude Code](https://claude.ai/code) — watch your AI team move, type, wander, and react in a retro game-style virtual office right inside VS Code.

---

## What is AI Pixel Office?

Every Claude Code terminal you open becomes an **animated pixel character** in a shared virtual office. Characters react to what your agents are actually doing — typing when working, wandering when idle, freezing when waiting for your permission.

### Key Features

- **Live agent visualization** — each Claude Code session = one animated character
- **Real-time activity** — characters animate based on actual tool usage (typing, reading, walking)
- **🐼 Panda Orchestrator** — click any agent to customize: choose character style, enable the special Panda (B&W) mode for your main orchestrator
- **Character customization** — click an agent to set a name, gender, and style
- **Permission alerts** — speech bubbles appear instantly when an agent needs your approval
- **Sub-agents** — Task/Agent tool sub-processes spawn as linked characters
- **Team visualization** — AI teams show lead/member roles with token usage bars
- **Editable office layout** — paint floors, walls, place furniture, assign desks
- **Persistent office** — layout and character assignments survive VS Code restarts
- **Instant detection** — Claude Code hooks for zero-latency event tracking

---

## Getting Started

1. Install the extension from the VS Code Marketplace (or load the `.vsix` file)
2. Open the **AI Pixel Office** panel in the bottom panel area
3. Start a Claude Code session — your agent appears as a character
4. **Click any character** to customize: name, style, or turn them into a 🐼 Panda!

---

## Character Customization

Click on any agent character to open the customization panel:

| Option | Description |
|--------|-------------|
| **Human style** | 6 different character appearances |
| **🐼 Panda style** | Black & white mode with panda ears — perfect for your main orchestrator |
| **Gender** | Neutral / Female / Male cosmetic preference |
| **Name** | Custom display name shown in the overlay |
| **Focus Terminal** | Jump directly to the agent's terminal |

---

## Panda Orchestrator

Your main AI orchestrator deserves a special look. Enable **Panda mode** on any agent:
- The character sprite becomes fully black & white
- Cute panda ears appear above the head
- A 🐼 emoji shows in the overlay label
- For team leads, the panel shows: *"Main Orchestrator"*

---

## Office Layout Editor

Click **Layout** in the bottom toolbar to enter edit mode:

- **Paint floors** — 9 floor tile types with custom colors
- **Paint walls** — multiple wall sets
- **Place furniture** — desks, chairs, computers, plants, decorations
- **Drag to move** — reposition any furniture
- **Expand the grid** — grow the office up to 64×64 tiles

---

## Hook Integration (Instant Detection)

AI Pixel Office supports Claude Code hooks for real-time event detection:

- Permission prompts appear the instant Claude asks for approval
- Turn completions detected the moment they happen
- Sound notifications play immediately on completion

Hooks are automatically installed and can be managed in **Settings → Instant Detection**.

---

## Custom Assets

Add custom furniture and character sprites via an external asset directory.
See [docs/external-assets.md](docs/external-assets.md) for details.

---

## Tech Stack

- **VS Code Extension** (TypeScript)
- **Webview UI** — React 19 + Canvas 2D
- **Hook server** — Node.js HTTP server for real-time Claude Code events
- **Pixel art** — custom sprite sheets, floor/wall tilesets

---

## Credits

Originally based on [Pixel Agents](https://github.com/pablodelucca/pixel-agents) by pablodelucca (MIT).
Extended and rebranded as **AI Pixel Office** by [Hali0s](https://github.com/Hali0s).

## License

MIT
