export type MessageRole = 'player' | 'gm' | 'system';

export type ActiveView = 'play' | 'campaigns' | 'journal' | 'rooms' | 'settings';

export interface ProviderSettings {
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  seedreamBaseUrl: string;
  seedreamApiKey: string;
  seedreamModel: string;
  autoGenerateImages: boolean;
  ragEnabled: boolean;
}

export interface RollResult {
  formula: string;
  total: number;
  dice: number[];
  modifier: number;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface PlayerCharacter {
  id: string;
  userId?: string;
  playerName: string;
  name: string;
  level: number;
  characterClass: string;
  archetype: string;
  ancestry: string;
  armorClass: number;
  proficiencyBonus: number;
  abilities: AbilityScores;
  skills: string[];
  features: string[];
  spellSlots: string[];
  conditions: string[];
  hp: number;
  maxHp: number;
  deathSaves: { successes: number; failures: number };
}

export interface NPCCharacter {
  id: string;
  name: string;
  type: 'civilian' | 'merchant' | 'guard' | 'mini-boss' | 'boss';
  level: number;
  armorClass: number;
  hp: number;
  maxHp: number;
  isRevealed: boolean;
  ai?: { behavior: string; disposition: number; triggers?: string[]; combatTactics?: string; dialogueStyle?: string };
  isPersistent?: boolean;
  generatedAt?: string;
  proficiencyBonus?: number;
  abilities?: AbilityScores;
  skills?: string[];
  features?: string[];
  conditions?: string[];
  deathSaves?: { successes: number; failures: number };
}

export interface QuestRecord {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
}

export interface CombatantRecord {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  hp: number;
  maxHp: number;
  armorClass: number;
}

export interface LocationRecord {
  id: string;
  name: string;
  aspects: string[];
}

export interface FactionRecord {
  id: string;
  name: string;
  resources: number;
}

export interface FrontRecord {
  id: string;
  name: string;
  clock: number;
  maxClock: number;
}

export interface KnowledgeDocument {
  title: string;
  content: string;
  source?: string;
}

export interface WorldSetting {
  genre: string;
  tone: string;
  pillars: string[];
  locations: LocationRecord[];
  factions: FactionRecord[];
  npcs: { id: string; name: string; role: string }[];
  truths: string[];
  fronts: FrontRecord[];
  knowledgeBase: KnowledgeDocument[];
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  rulesetId: string;
  createdAt: string;
  updatedAt: string;
  setting: WorldSetting;
  party: PlayerCharacter[];
  npcs: NPCCharacter[];
  currentScene: string;
  sceneSummary?: string;
  sceneGoal?: string;
  sceneObstacles?: string[];
  sceneTools?: string[];
  sceneCallToAction?: string;
  currentLocationId?: string;
  activeFrontId?: string;
  threatClock: number;
  inventory: string[];
  gold: number;
  quests: QuestRecord[];
  combatants: CombatantRecord[];
  playPhase: 'roleplay' | 'exploration' | 'combat' | 'rest' | 'downtime';
  currentRound: number;
  sessionNumber: number;
  campaignLog: string[];
  imageUrl?: string;
  currentStep: number;
  currentChapterId?: string;
  currentBeatId?: string;
  proposedActions: { id: string; playerId: string; playerName: string; content: string; votes: string[]; createdAt: string }[];
}

export type MessageType = 'speech' | 'action' | 'question' | 'vote' | 'gm_narration' | 'system' | 'hidden_action';

export type MessageVisibility = 'public' | 'private' | 'hidden';

export interface GameMessage {
  id: string;
  campaignId?: string;
  role: MessageRole;
  speakerName?: string;
  speakerId?: string;
  characterId?: string;
  content: string;
  messageType: MessageType;
  visibility: MessageVisibility;
  channel: 'public' | 'whisper';
  createdAt: string;
  voteOptions?: string[];
  votes?: Record<string, number>;
  imageUrl?: string;
  roll?: RollResult;
}

export interface RequestedRoll {
  description: string;
  ability: keyof AbilityScores;
  skill?: string;
  dc: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface GmTurn {
  narration: string;
  scene: string;
  sceneSummary: string;
  goal?: string;
  obstacles: string[];
  tools: string[];
  callToAction: string;
  currentLocationId?: string;
  frontClockDeltas: Record<string, number>;
  locationAspectUpdates: Record<string, string[]>;
  factionResourceAdd: Record<string, number>;
  npcLeverageUpdates: Record<string, number>;
  imagePrompt?: string;
  requestedRoll?: RequestedRoll;
}

export interface UserAccount {
  id: string;
  username: string;
  passcode: string;
  displayName?: string;
}

export interface RoomSession {
  roomId: string;
  role: 'host' | 'player';
  participantId: string;
  participantName: string;
  hostToken?: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  role: 'host' | 'player';
  joinedAt: string;
  characterId?: string;
}

export interface PendingAction {
  id: string;
  playerId: string;
  playerName: string;
  characterId?: string;
  content: string;
  type: 'action' | 'question' | 'hidden';
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  gmResponse?: string;
}

export interface PublicRoomState {
  roomId: string;
  hostConnected: boolean;
  campaign?: Campaign;
  messages: GameMessage[];
  privateMessages: GameMessage[];
  participants: RoomParticipant[];
  pendingActions: PendingAction[];
}
