# MythWeaver — Frontend UI Design

Redesign of all frontend components. Layout, navigation, and state management.

---

## 1. App Shell

### Layout Pattern: Sidebar + Main Content

```
+----------------------------------------------------------+
|  Header (fixed top)                                      |
|  [Logo]  [Play] [Room] [Journal]  [Role: Player|GM]  [User] |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------------------+  |
|  | Sidebar (left)   |  | Main Content Area            |  |
|  |                  |  |                              |  |
|  | [State Boards]   |  | [Active Tab Content]         |  |
|  | [Character]      |  |                              |  |
|  | [Party]          |  |                              |  |
|  +------------------+  +------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Navigation

Top nav items (visible based on role):
- **Play** — always visible (player: their character + game state; GM: full campaign tools)
- **Room** — always visible (multiplayer chat room)
- **Journal** — always visible (message history, logs)
- **Campaigns** — GM only (campaign list, creation)
- **Settings** — GM only (provider keys, system config)

No role toggle in header. Role determined by login/room assignment.

---

## 2. Play Tab

### Player View

```
+----------------------------------------------------------+
|  PLAY — Campaign Name                                    |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------------------+  |
|  | GAME STATE BOARD |  | COMMUNICATION CHANNELS       |  |
|  |                  |  |                              |  |
|  | Current Scene    |  | Tabs: [Public] [Private]     |  |
|  | Phase: Prepare   |  |                              |  |
|  | Step: 3/12       |  | [Public chat messages]       |  |
|  | Front: 4/6       |  | [Vote cards]                 |  |
|  | Gold: 120gp      |  |                              |  |
|  |                  |  | [Input: Type message...]     |  |
|  | What to do:      |  | [Send] [Action] [Hidden]     |  |
|  | - Buy gear       |  |                              |  |
|  | - Find clues     |  +------------------------------+  |
|  +------------------+                                  |
|                                                          |
|  +------------------+  +------------------------------+  |
|  | MY CHARACTER     |  | ALL CHARACTERS               |  |
|  |                  |  |                              |  |
|  | Thorin           |  | Thorin  HP 12/12  Fighter    |  |
|  | HP 12/12         |  | Luna    HP 8/8   Wizard     |  |
|  | AC 16            |  | Guard   HP ?/?   [?]        |  |
|  | [i] STR 14       |  |                              |  |
|  | [i] DEX 12       |  | (NPCs in scene shown)        |  |
|  | Conditions: none |  |                              |  |
|  +------------------+  +------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### GM View (Play Tab)

Same layout but with full information and GM controls:
- Game State Board: exact front clocks, all secrets revealed
- My Character: all player character sheets (not just one)
- All Characters: includes hidden NPCs, full stats for all
- Communication: additional "Action Queue" tab showing pending player actions
- Input area: GM can send narration, resolve next queue item, or trigger NPC generation

---

## 3. Room Tab

Same as Play tab but focused on multiplayer:
- Same 3 state boards (game, self, all characters)
- Communication channels (public + private to GM)
- Action queue visible to GM
- Join overlay for invite link landing
- Room info panel (invite link, participants)

---

## 4. Component Inventory

### Layout Components

| Component | Purpose | Used By |
|-----------|---------|---------|
| `AppShell` | Top nav + sidebar + main area layout | App.tsx |
| `Sidebar` | Collapsible left panel for state boards | Play, Room |
| `MainContent` | Active tab content area | All tabs |
| `Header` | Logo, nav, role display | AppShell |

### State Board Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `GameStateBoard` | `campaign: Campaign`, `isGM: boolean` | Show scene, phase, step, fronts, gold, direction |
| `CharacterBoard` | `character: PlayerCharacter`, `isOwner: boolean` | Single character sheet with stat tooltips |
| `PartyBoard` | `party: PlayerCharacter[]`, `npcs: NPC[]`, `isGM: boolean` | All characters in campaign/scene |
| `ActionQueue` | `pendingActions: PendingAction[]`, `onResolve: fn` | GM only — queue of player actions |

### Communication Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `ChatChannel` | `messages: GameMessage[]`, `channel: 'public'|'private'` | Message log with vote rendering |
| `VoteCard` | `vote: GameMessage`, `onVote: fn` | Interactive voting card with buttons |
| `ChatInput` | `channel: 'public'|'private'`, `messageType: MessageType`, `onSend: fn` | Textarea + send + type toggles |
| `JoinOverlay` | `roomId: string`, `onJoin: fn`, `onCancel: fn` | Invite link landing overlay |

### NPC Components (GM Only)

| Component | Props | Purpose |
|-----------|-------|---------|
| `NPCManager` | `npcs: NPC[]`, `onGenerate: fn`, `onEdit: fn` | GM panel for NPC management |
| `NPCGenerator` | `partyStrength: number`, `onGenerate: fn` | Generate NPC with type + multiplier |
| `NPCCard` | `npc: NPC`, `isGM: boolean` | NPC display with AI section (GM only) |

### Character Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `CharacterSheet` | `character: PlayerCharacter|NPC`, `showTooltips: boolean` | Full sheet with info icons |
| `StatTooltip` | `stat: string`, `description: string` | Hover tooltip for any stat |
| `AutoGenerateButton` | `onGenerate: fn`, `type: 'player'|'npc'` | 1-click generation |

---

## 5. State Management

### URL-Driven Room State

```
/?room=abc123          → Show join overlay
/?room=abc123&host=xxx → Auto-join as host
/no-params             → Normal app, Room tab shows create/join UI
```

### Global State (App-level)

```typescript
interface AppState {
  // Auth
  currentUser: UserAccount | null;
  userRole: 'player' | 'gm';

  // Navigation
  activeView: 'play' | 'room' | 'journal' | 'campaigns' | 'settings';

  // Campaign
  campaigns: Campaign[];
  activeCampaignId: string | null;

  // Room
  roomSession: RoomSession | null;
  roomState: PublicRoomState | null;

  // UI
  roomChannel: 'public' | 'private';
  roomMessageType: 'speech' | 'action' | 'hidden';
  showJoinOverlay: boolean;

  // Loading
  busy: boolean;
  error: string;
  status: string;
}
```

### Room Polling

- Poll every 2.5s when `roomSession` exists
- Pass `participantId` for filtered state
- Cancel on unmount or room exit

---

## 6. Key Interactions

### Player Sends Action

1. Player types in chat input
2. Selects type: speech / action / hidden
3. Selects channel: public / private to GM
4. Clicks Send
5. POST to `/api/rooms/:id/action` with message + participantId
6. If `type === 'action'` → added to `pendingActions` queue
7. If `type === 'hidden'` → content masked as `[?]` for others
8. Server returns updated state

### GM Resolves Action

1. GM sees action queue in Room tab
2. Clicks "Resolve" on first pending action
3. Client calls LLM with action context
4. GM reviews/edits LLM response
5. POST to `/api/rooms/:id/gm-turn` with resolved action ID
6. Server removes action from queue, adds GM narration
7. If combat triggered, combat state updated

### NPC Generation

1. GM opens NPC Manager (GM Play tab)
2. Clicks "Generate NPC"
3. Selects type: merchant / guard / mini-boss / boss
4. Sets strength multiplier (GM decides)
5. Client calls LLM API with party strength context
6. LLM returns NPC with scaled stats + AI section
7. NPC added to campaign.npcs
8. If type is mini-boss/boss → marked as persistent
9. If type is merchant/guard → temporary until promoted

---

## 7. CSS Layout Notes

- Use CSS Grid for main layout (`grid-template-columns: 280px 1fr`)
- Sidebar is collapsible on mobile (`< 768px`)
- State boards use card pattern with subtle borders
- Chat area uses flex column with `overflow-y: auto`
- Dark theme maintained (existing color scheme)
- Responsive: stack sidebar above main content on narrow screens
