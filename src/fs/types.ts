// MythWeaver File System Types
// Maps REQUIREMENT_R.md + ARCHITECTURE.md data architecture requirements

// ─── Core Identifiers ───
export type CampaignId = string;
export type PlayerId = string;
export type NpcId = string;
export type MessageId = string;
export type ActionId = string;

// ─── SHARED FILE: shared.json ───
// World state + public messages + vote data + action queue
// Readable by all; writable by GM only

export interface SharedFile {
  campaignId: CampaignId;
  version: number;
  lastModified: string;

  // Scene state (C2: opening & direction)
  scene: SceneState;

  // Game progress
  currentStep: number;
  maxSteps: number;
  playPhase: 'prepare' | 'exploration' | 'social' | 'combat' | 'rest' | 'downtime';
  currentRound: number;

  // World state
  setting: string;           // world description
  fronts: Front[];
  clocks: Record<string, number>;
  gold: number;              // party treasury
  inventory: string[];        // shared party loot

  // Quests (C2: direction at each stage)
  quests: Quest[];

  // Communication (F2: public discussion + voting)
  messages: PublicMessage[];
  votes: Vote[];

  // Action queue (G1: singular thread)
  pendingActions: PendingAction[];

  // Party roster (just IDs; full data in player files)
  partyIds: PlayerId[];

  // NPCs in scene with combat stats (readable by all; hidden ones show [?] to players)
  npcs: SharedNpc[];

  // Combat tracker
  combat: CombatState | null;
}

export interface SceneState {
  title: string;
  description: string;
  playerRole: string;         // what the party is doing here
  ultimateGoal: string;       // campaign-level objective
  immediateObjective: string;  // what to do RIGHT NOW (C2)
  direction: string[];          // suggested next steps (buy gear, gather info, etc.)
  location: string;
  isRevealed: boolean;
}

export interface Front {
  id: string;
  name: string;
  clock: number;
  maxClock: number;
  description: string;
  doom: string;                // what happens if clock fills
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objective: string;           // what player must do
  reward?: string;
}

export interface PublicMessage {
  id: MessageId;
  senderId: PlayerId | 'gm' | 'system';
  senderName: string;
  content: string;
  type: 'speech' | 'action' | 'question' | 'gm_narration' | 'system';
  timestamp: string;
}

export interface Vote {
  id: string;
  question: string;
  options: string[];
  tallies: Record<string, number>; // option index → count
  votesByPlayer: Record<PlayerId, number>; // player → option index
  status: 'open' | 'closed';
  createdAt: string;
  closedAt?: string;
}

export interface PendingAction {
  id: ActionId;
  playerId: PlayerId;
  playerName: string;
  type: 'action' | 'question' | 'hidden';
  content: string;
  status: 'pending' | 'performing' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  gmResponse?: string;
}

// ─── SHARED NPC (embedded in shared.json for combat visibility) ───

export interface SharedNpc {
  id: NpcId;
  name: string;
  role: string;
  type: 'civilian' | 'merchant' | 'guard' | 'mini-boss' | 'boss';
  isRevealed: boolean;     // false → players see [?]
  isActiveInCombat: boolean;

  // Stats
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  abilities: Abilities;

  // Combat state
  initiative: number;
  conditions: string[];
}

export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number;       // whose turn in the order array
  order: Combatant[];      // initiative order
  log: string[];           // what happened this combat
}

export interface Combatant {
  id: string;              // npcId or playerId
  name: string;
  type: 'npc' | 'player';
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions: string[];
}

// ─── PLAYER FILE: players/{playerId}.json ───
// Profile + character + private messages + personal state
// Readable by owner + GM; writable by owner

export interface PlayerFile {
  campaignId: CampaignId;
  playerId: PlayerId;
  version: number;
  lastModified: string;

  // Profile
  profile: PlayerProfile;

  // Character (B1: each player has exactly 1 character)
  character: CharacterFile;

  // Private communication (F2: silent talk to GM)
  privateMessages: PrivateMessage[];

  // Personal state
  personalGold: number;
  personalInventory: string[];
  conditions: string[];
  deathSaves: DeathSaves;
}

export interface PlayerProfile {
  displayName: string;
  role: 'player' | 'gm';
  joinedAt: string;
  isOnline: boolean;
}

// ─── CHARACTER FILE (embedded in player file) ───
// B1: 1-click generation; B2: death check

export interface CharacterFile {
  id: string;
  name: string;
  ancestry: string;
  class: string;
  level: number;

  // Core stats (A3: info icon on each stat)
  hp: number;
  maxHp: number;
  ac: number;
  proficiencyBonus: number;

  // Abilities
  abilities: Abilities;

  // Skills & features
  skills: string[];
  features: string[];
  spellSlots: string[];

  // Conditions (B2: death check)
  conditions: string[];
  deathSaves: DeathSaves;

  // Backstory
  backstory: string;
}

export interface Abilities {
  str: number;  // Strength: melee attacks, lifting, athletics
  dex: number;  // Dexterity: ranged attacks, AC, stealth
  con: number;  // Constitution: HP max, endurance
  int: number;  // Intelligence: arcana, investigation
  wis: number;  // Wisdom: perception, insight, survival
  cha: number;  // Charisma: persuasion, deception, performance
}

export interface DeathSaves {
  successes: number;  // 3 = stable
  failures: number;   // 3 = dead
}

export interface PrivateMessage {
  id: MessageId;
  direction: 'to-gm' | 'from-gm';
  content: string;
  timestamp: string;
  isAction: boolean;     // true = player requesting action
  gmResponse?: string;  // GM reply
}

// ─── NPC FILE: npcs/{npcId}.json ───
// H1: separate AI section governing behavior; GM-only editable
// H2: auto-generated with scaled stats

export interface NpcFile {
  campaignId: CampaignId;
  npcId: NpcId;
  version: number;
  lastModified: string;

  // Core identity
  name: string;
  role: string;              // merchant, guard, quest-giver, etc.
  type: 'civilian' | 'merchant' | 'guard' | 'mini-boss' | 'boss';
  isRevealed: boolean;     // false = players see [?]
  isPersistent: boolean;    // true = saved across sessions

  // Stats (scaled to party per H2)
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  abilities: Abilities;

  // AI Section (H1: under GM control)
  ai: NpcAI;

  // GM notes
  gmNotes: string;
  secret: string;           // what players don't know
}

export interface NpcAI {
  behavior: 'aggressive' | 'cautious' | 'friendly' | 'neutral' | 'dominant';
  disposition: number;        // -5 (hostile) to +5 (friendly)
  triggers: AiTrigger[];    // what events change disposition
  combatTactics: string;    // e.g. "focus weakest, retreat at 50% HP"
  dialogueStyle: string;     // e.g. "gruff and suspicious"
  loot?: string[];
}

export interface AiTrigger {
  event: string;             // e.g. "player attacks", "player offers bribe"
  dispositionDelta: number;  // how disposition changes
  action?: string;           // e.g. "attack", "flee", "call guards"
}

// ─── Storage Keys (localStorage) ───

export const storageKey = {
  shared: (campaignId: CampaignId) => `mw_shared_${campaignId}`,
  player: (campaignId: CampaignId, playerId: PlayerId) => `mw_player_${campaignId}_${playerId}`,
  npc: (campaignId: CampaignId, npcId: NpcId) => `mw_npc_${campaignId}_${npcId}`,
  campaigns: () => 'mw_campaigns_list',
  llmLogs: () => 'mw_llm_logs',
};

// ─── File Operations Interface ───

export interface FileSystem {
  // Shared file
  readShared(campaignId: CampaignId): Promise<SharedFile>;
  writeShared(campaignId: CampaignId, data: SharedFile): Promise<void>;

  // Player file
  readPlayer(campaignId: CampaignId, playerId: PlayerId): Promise<PlayerFile>;
  writePlayer(campaignId: CampaignId, playerId: PlayerId, data: PlayerFile): Promise<void>;

  // NPC file
  readNpc(campaignId: CampaignId, npcId: NpcId): Promise<NpcFile>;
  writeNpc(campaignId: CampaignId, npcId: NpcId, data: NpcFile): Promise<void>;

  // Campaign list
  listCampaigns(): Promise<CampaignId[]>;
  createCampaign(campaignId: CampaignId, shared: SharedFile): Promise<void>;
  deleteCampaign(campaignId: CampaignId): Promise<void>;
}
