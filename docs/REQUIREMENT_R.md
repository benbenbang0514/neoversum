# Neoversum TRPG — Requirements by Design Domain

Grouped by the area of the system each requirement targets. Derived directly from user statements.

---

## A. UI / UX Design

**A1. Clarity**
- UI must be more clear overall.
- Current GUI layout design and functionality make absolutely 0 sense — needs redesign.

**A2. Player vs. GM Distinction**
- Player (not GM) UI must be distinct from half-GM UI.
- Separate login UI which soft-blocks access to see messy settings that only GM need to know.
- GM page for starting a new game.

**A3. Information Display**
- Info icon on each stat which displays what that stat does when hovered.

---

## B. Character System

**B1. Creation & Ownership**
- 1-click character generation button.
- Each game section should have its own character.
- Each player should have only 1 character.

**B2. Health & Death**
- Make sure you do death check.

---

## C. GM & Narrative Engine

**C1. GM Authority**
- GM is supposed to be the highest authority to guide the story throughout.

**C2. Opening & Direction**
- GM opening should have introduction to story setting, player role, and ultimate goal — not just "what do you do?"
- Game state should explain what player should do at each stage (e.g., buy equipment, earn money first, info gathering, small boss fighting).

**C3. Content Quality**
- Find good online rule book with complete lore book and rule book.

---

## D. Authentication & Session

- Login should actually do something meaningful.

---

## E. Multiplayer Room System

**E1. Core Room**
- Room should be an actively reloading chat room that every player has access to.

**E2. Invite & Join Flow**
- Design a flow for how a player joins the game after clicking the invite link.

---

## F. Data Architecture

**F1. File Organization**
- Each game should have a file; store each player's thing in separate player file and shared things.
- Player file should have their own character file with all settings inside.

**F2. Communication Scenarios (to be modeled in storage)**
- Normal public discussion.
- Voting (with like Discord voting popup or something).
- Silent/single talk to GM to perform action.

---

## G. Game Flow & Information Hiding

**G1. Turn Resolution**
- GM story flow should be singular thread — perform 1 task at a time when multiple requests from different players.
- Asking should be able to do simultaneously.

**G2. Visibility Rules**
- Do not reveal any information each player should not know.
- Players should be able to see performing action and pending action.
- Hidden action should be shown as `[?]`.

**G3. Player HUD**
- Player should have access to:
  - state board of the game
  - state board of himself
  - state board of all characters (including appearing NPC in the scene)
  - public channel for discussion and voting
  - private section to GM for personal actions (examples: buy thing from merchant, hidden action like poison food)

---

## H. NPC AI System

**H1. NPC AI Section**
- Each NPC has a separate AI section governing its behavior.
- AI section is under GM control.
- Related info stored in the NPC character file.

**H2. Auto-Generate NPC Settings**
- 1-click button to auto-generate NPC settings.
- Each NPC should refer to a suitable total strength.
- Mini/boss NPC should have about 3-5x total strength of player.
- Non-combat NPC should have main stat similar to player and weak others.
- GM decides exact scaling.

**H3. NPC Generation Timing**
- NPC generation done via separate API requests.
- Mini boss and boss should be pre-generated at start of campaign generation.
- Other NPCs generated when triggered (e.g., player goes into market then generate merchant NPC).
