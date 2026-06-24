# Neoversum Multiplayer Architecture

Mirrors the 7 design domains from REQUIREMENT_R.md. Each section maps requirements to technical design. Anything not explicitly stated by the user is marked `[ASSISTANT INFERENCE]`.

---

## A. UI / UX Design

### A1. Clarity — Redesign current layout

User said: "current whole gui layout design and functionality make absolutely 0 sense"

Design direction:
- Each screen should have a single clear purpose.
- Reduce cognitive load: group related controls, hide advanced options.
- Use consistent visual hierarchy.

[ASSISTANT INFERENCE]: The user did not specify a layout pattern (sidebar, tabs, cards, etc.). Any specific layout proposal needs user confirmation.

### A2. Player vs. GM Distinction

User said:
- "Player (not gm) ui distinct from half gm ui"
- "seperate login ui which soft block access to see messy setting that only gm need to know"
- "make a gm page for starting a new game"

Design:
- Two distinct view modes: player mode and GM mode.
- GM mode shows all tools, settings, campaign creation, room hosting.
- Player mode shows only: play area, personal state, public/private channels, character sheet.
- Login state determines which mode is available [ASSISTANT INFERENCE: user did not say login gates mode, only asked "does the current login actually do anything???"].
- GM page for new game is a dedicated screen, not mixed with player play screen.

### A3. Information Display — Stat tooltips

User said: "add a info icon which display what does each stat do when hover on the icon"

Design:
- Each character stat has a small info icon.
- Hovering shows a tooltip explaining that stat.
- [ASSISTANT INFERENCE]: Exact tooltip text is not specified by user. Should be factual description, not opinionated flavor text.

---

## B. Character System

### B1. Creation & Ownership

User said:
- "make 1 click character generation button"
- "each game should have its own character"
- "each player should have only 1 character"
- "why tf is there a dropdown which i can choose OTHER PLAYERS CHARACTER"

Design:
- One-click auto-generates a valid character (class, ancestry, stats).
- No dropdown to switch to another player's character.
- Each player is bound to exactly one character per campaign.
- Character stored inside player's file.

[ASSISTANT INFERENCE]: Exact classes, ancestries, and stat generation method were not specified. I previously invented Fighter/Wizard/Rogue/Cleric/Ranger.

### B2. Health & Death

User said: "make sure you do death check"

Design:
- When HP drops to 0 or below, death check mechanic triggers.
- [ASSISTANT INFERENCE]: The user did not specify what "death check" means mechanically. I previously invented death saves (successes/failures). This needs clarification.

---

## C. GM & Narrative Engine

### C1. GM Authority

User said: "the half gm is supposed to be the highest authority to guide the story throughout"

Design:
- The LLM GM ("Half-GM") drives narrative progression.
- All story-advancing actions must pass through the GM.
- GM decides consequences, scene changes, combat triggers.

### C2. Opening & Direction

User said:
- "the opening should have introduction to story setting, and player role, and the ultimate goal, instead of just what do you do"
- "what does state do?? shouldnt it explain what should player do at each stage"

Design:
- Campaign opening message must contain: setting intro, player role description, ultimate goal.
- Game state must indicate what the player should do (e.g., "Buy equipment", "Gather info", "Fight boss").
- This direction appears in the state board, not just buried in narrative text.

### C3. Content Quality

User said: "template should be more like good online one with complete lore book and rule book"

Design:
- Templates should include substantial lore and rules, not just skeleton prompts.
- [ASSISTANT INFERENCE]: The user did not specify what "good online one" means. Need examples or further direction on content depth.

---

## D. Authentication & Session


---

## E. Multiplayer Room System

### E1. Core Room

User said: "make room actively reloading chat room which every player has access to"

Design:
- Room state polled continuously from server (or WebSocket).
- All players receive updates without refreshing page.
- Room contains: campaign state, messages, participants, pending actions.

### E2. Invite & Join Flow

User said: "design a flow for how a player join the game after clicking the invite link"

Design:
- Invite link contains room ID.
- Player clicks link → lands on app with room context.
- Player provides display name → joins room.
- Player now sees room UI with all state boards and channels.

[ASSISTANT INFERENCE]: Whether player creates character before or after joining, and exact UI of the join screen, are not specified.

---

## F. Data Architecture

### F1. File Organization

User said:
- "each game should have a file, store each player's thing in seperate player file and shared things"
- "player file should have their own character file with all settings inside"

Design:
- Per campaign/room:
  - One shared state file (world, scene, clocks, quests, public messages)
  - One file per player (profile + character + private messages + personal state)
- This mirrors the "separate player file and shared things" instruction.

[ASSISTANT INFERENCE]: Exact file format (JSON, IndexedDB stores, etc.) and naming convention not specified.

### F2. Communication Scenarios

User said: "design better structure for game data storage considering all scenario: normal public discussion, voting, with like discord voting popup or something, silent/single talk to gm to perform action"

#### Scenario A: Public Discussion
- Stored in shared state file.
- Every participant sees all messages.

#### Scenario B: Voting
- Stored in shared state file with vote metadata (options, tallies).
- Displayed as interactive card with buttons.
- [ASSISTANT INFERENCE]: User said "like discord voting popup" — this implies a card-style UI element, not a modal popup.

#### Scenario C: Silent Talk to GM
- Stored either in player file (since it's player-specific) OR in shared file marked private.
- [ASSISTANT INFERENCE]: User said "separate player file" — this suggests private talk belongs in player file. But for GM to access it, it must be readable by GM. Either GM reads all player files, or private messages sync to shared state but filtered by visibility.

---

## G. Game Flow & Information Hiding

### G1. Turn Resolution

User said:
- "the gm story flow should be singular thread, perform 1 task at a time when multiple request from different players"
- "asking should be able to do simutanously"

Design:
- **Actions** (things that advance story: attack, cast spell, pick lock, persuade NPC) → enter **queue**.
- **Questions** ("Can I see that?", "What does the room look like?") → answered **immediately**, do not enter queue.
- GM processes queue one item at a time.
- While GM resolves action #1, players can still ask questions and chat publicly.

### G2. Visibility Rules

User said:
- "do not reveal any information each player should not know"
- "players should be able to see performing action and pending action"
- "hidden action should be shown as [?]"

Design:
- Normal action: visible to all as "performing" or "pending".
- Hidden action: visible to all as `[?]`. Only sender and GM see full content.
- Pending action queue: players see their own actions in full; other players see "waiting" or `[?]`.
- GM sees everything unfiltered.

[ASSISTANT INFERENCE]: What counts as "information each player should not know" beyond hidden actions is not specified. Examples: NPC hidden motives, exact front clock values, other players' private rolls.

### G3. Player HUD

User said player should have access to:
1. state board of the game
2. state board of himself
3. state board of all characters (including appearing NPC in the scene)
4. public channel for discussion and voting
5. private section to GM for personal actions

Design:
- These 5 components must be present in player UI.
- [ASSISTANT INFERENCE]: Exact layout (sidebar, tabs, panels) not specified. Arrangement needs to be proposed or user-directed.

---

## H. NPC AI System

### H1. NPC AI Section

User said:
- "each npc should have seperated ai section which goverwnt its behaviour, which the section is under gm"
- "related info should be stored in the npc character file"

Design:
- Each NPC has an `ai` field in its character file.
- AI section contains: behavior rules, disposition toward party, reaction triggers, combat tactics, dialogue style.
- AI section is GM-editable and GM-viewable only.
- NPC file structure:
  ```
  NPC Character File:
  ├── id, name, type ('mini-boss' | 'boss' | 'merchant' | 'guard' | 'civilian')
  ├── stats (hp, maxHp, ac, abilities, etc.)
  ├── ai:
  │   ├── behavior: string (e.g., "aggressive", "cautious", "friendly")
  │   ├── disposition: number (-5 hostile to +5 friendly)
  │   ├── triggers: array (what events change disposition)
  │   ├── combatTactics: string (e.g., "focus weakest", "run at 50% hp")
  │   └── dialogueStyle: string
  └── isRevealed: boolean (whether players know this NPC exists)
  ```

### H2. Auto-Generate NPC Settings

User said:
- "1 butto ge neratwe character"
- "each character should reger to a suitable total stren g"
- "mini/big boss hould have about 3/5x total strength of player"
- "non combat npc should hvwe main stat similar to player and weak other"
- "let the gm decide"

Design:
- GM sees an "Generate NPC" button in NPC management panel.
- GM selects NPC type: mini-boss, boss, merchant, guard, civilian.
- GM can set strength multiplier (default: mini-boss 3x, boss 5x, merchant/guard/civilian 0.5-1x).
- Separate API call to LLM generates NPC with stats scaled to party strength.
- Non-combat NPC: main stat (relevant to role) matches player average, other stats weak.
- Combat NPC: total stat budget = player total × multiplier.

### H3. NPC Generation Timing

User said:
- "mini boss and boss dhould e pre generated at start"
- "when player goes into market then shojd geerrate merchatnt npc"

Design:
- **Pre-generated at campaign start**: mini-bosses and bosses from the template's chapter/beat structure.
- **On-demand generation**: When GM triggers scene change or when player enters a location (e.g., market → merchant), GM clicks "Generate NPC for this scene" which calls API.
- On-demand NPCs are temporary unless GM promotes them to persistent.
- NPC generation is a separate API call from campaign generation, using the same LLM provider.
