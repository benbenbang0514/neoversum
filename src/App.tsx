import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Download, Library, Play, Send, ShieldCheck, Trash2, Upload, Wand2 } from 'lucide-react';
import './styles.css';

// ─── Types ───
type ActiveView = 'play' | 'campaigns' | 'journal' | 'rooms';
type CreationStep = 'params' | 'preview' | 'generating' | 'done';

interface Campaign {
  id: string;
  name: string;
  genre: string;
  tone: string;
  currentStep: number;
  maxSteps: number;
  currentScene: string;
  playPhase: string;
  currentRound: number;
  party: Character[];
  messages: Message[];
  npcs: NPC[];
  quests: Quest[];
  setting: string;
  createdAt: string;
  sessions: SessionOutline[];
}

interface Character {
  id: string;
  name: string;
  playerName: string;
  level: number;
  class: string;
  ancestry: string;
  hp: number;
  maxHp: number;
  ac: number;
  abilities: Record<string, number>;
  conditions: string[];
}

interface NPC {
  id: string;
  name: string;
  role: string;
  disposition: 'friendly' | 'neutral' | 'hostile';
  secret?: string;
  hp?: number;
  maxHp?: number;
  ac?: number;
}

interface Quest {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  description: string;
}

interface SessionOutline {
  id: string;
  number: number;
  title: string;
  hook: string;
  exploration: string;
  social: string;
  combat: string;
  resolution: string;
}

interface Message {
  id: string;
  role: 'player' | 'gm' | 'system';
  speakerName?: string;
  content: string;
  createdAt: string;
}

interface LLMLogEntry {
  timestamp: string;
  model: string;
  status: 'sent' | 'success' | 'error';
  promptLength: number;
  responsePreview: string;
  errorMessage?: string;
}

interface CampaignParams {
  genre: string;
  tone: string;
  theme: string;
  partyLevel: number;
  partySize: number;
  sessions: number;
  hookStyle: string;
}

// ─── Hardcoded config from .env ───
const API_URL = import.meta.env.VITE_DEEPSEEK_URL || 'https://api.deepseek.com/v1';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const API_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

// ─── Helpers ───
const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
const roll = (formula: string) => {
  const m = formula.trim().match(/^([1-9]\d*)d([1-9]\d*)([+-]\d+)?$/i);
  if (!m) return { total: 0, dice: [] as number[] };
  const dice = Array.from({ length: +m[1] }, () => Math.floor(Math.random() * +m[2]) + 1);
  return { total: dice.reduce((a, b) => a + b, 0) + (m[3] ? +m[3] : 0), dice };
};
const ls = { get: (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set: (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v)) };

const navItems = [
  { id: 'play' as ActiveView, label: 'Play', icon: Play },
  { id: 'campaigns' as ActiveView, label: 'Campaigns', icon: Library },
  { id: 'journal' as ActiveView, label: 'Journal', icon: BookOpen },
  { id: 'rooms' as ActiveView, label: 'Rooms', icon: ShieldCheck },
];

const GENRES = ['High Fantasy', 'Dark Fantasy', 'Sci-Fi', 'Horror', 'Steampunk', 'Mythic Greece', 'Feudal Japan', 'Post-Apocalyptic'];
const TONES = ['Gritty & Realistic', 'Heroic & Epic', 'Dark & Grim', 'Whimsical & Light', 'Mysterious & Noir', 'Savage & Primal'];
const HOOKS = ['Village under attack', 'Mysterious artifact found', 'Royal summons', 'Missing person', 'Ancient evil awakening', 'Treasure map discovered', 'Prophecy fulfillment', 'War brewing'];

// Build the LLM prompt for campaign generation
const buildCampaignPrompt = (p: CampaignParams): string => `
You are an expert D&D Dungeon Master with 20 years of experience. Create a complete tabletop RPG campaign following standard DM session flow.

STANDARD D&D SESSION FLOW (you must follow this structure):
1. HOOK - An inciting incident that draws the party in and gives them a clear motivation
2. EXPLORATION - The party investigates, travels, discovers clues, maps locations, overcomes environmental obstacles
3. SOCIAL - The party interacts with NPCs: gathers information, negotiates, deceives, befriends, or intimidates
4. COMBAT - A tactical encounter with meaningful stakes (not random monsters; the fight must matter to the story)
5. RESOLUTION - Consequences, rewards, leveling up hooks, new mysteries, and a bridge to the next session

CAMPAIGN PARAMETERS:
- Genre: ${p.genre}
- Tone: ${p.tone}
- Theme/Keywords: ${p.theme}
- Starting Party Level: ${p.partyLevel}
- Party Size: ${p.partySize} players
- Number of Sessions: ${p.sessions}
- Opening Hook Style: ${p.hookStyle}

Generate a complete campaign. Return ONLY valid JSON in this exact structure (no markdown, no explanation):

{
  "name": "Campaign Title",
  "genre": "${p.genre}",
  "tone": "${p.tone}",
  "setting": "2-3 paragraph description of the world, key locations, factions, and current situation",
  "openingScene": "Vivid GM narration of the very first moment the players experience. Set the mood, describe sensory details, and end with a clear call to action.",
  "npcs": [
    { "name": "NPC Name", "role": "their role in the story", "disposition": "friendly|neutral|hostile", "secret": "what they are hiding" }
  ],
  "quests": [
    { "title": "Quest Name", "status": "active", "description": "What the players need to do" }
  ],
  "sessions": [
    {
      "number": 1,
      "title": "Session Title",
      "hook": "What draws the players in this session",
      "exploration": "What they discover, investigate, or navigate",
      "social": "Key NPC interactions, negotiations, or interrogations",
      "combat": "The tactical encounter and why it matters",
      "resolution": "What changes, what rewards they get, and what hooks into the next session"
    }
  ]
}

Rules:
- Each session MUST have all 5 phases: hook, exploration, social, combat, resolution
- Make the campaign feel like a real D&D campaign with meaningful choices
- NPCs should have secrets and hidden agendas
- The combat encounters should be level-appropriate for ${p.partyLevel} characters
- Include 3-5 quests that unfold across the sessions
- Setting should be evocative and immersive
`;

const parseCampaignResponse = (text: string, params: CampaignParams): Partial<Campaign> | null => {
  try {
    const json = JSON.parse(text);
    const sessions: SessionOutline[] = (json.sessions || []).map((s: any, i: number) => ({
      id: createId('sess'),
      number: s.number || i + 1,
      title: s.title || `Session ${i + 1}`,
      hook: s.hook || '',
      exploration: s.exploration || '',
      social: s.social || '',
      combat: s.combat || '',
      resolution: s.resolution || '',
    }));
    return {
      name: json.name || 'Untitled Campaign',
      genre: json.genre || params.genre,
      tone: json.tone || params.tone,
      setting: json.setting || '',
      currentScene: json.openingScene || 'The adventure begins...',
      currentStep: 1,
      maxSteps: params.sessions * 5,
      playPhase: 'roleplay',
      currentRound: 1,
      npcs: (json.npcs || []).map((n: any, i: number) => ({
        id: createId('npc'),
        name: n.name || `NPC ${i + 1}`,
        role: n.role || 'Unknown',
        disposition: n.disposition || 'neutral',
        secret: n.secret || '',
      })),
      quests: (json.quests || []).map((q: any, i: number) => ({
        id: createId('quest'),
        title: q.title || `Quest ${i + 1}`,
        status: q.status || 'active',
        description: q.description || '',
      })),
      sessions,
      party: Array.from({ length: params.partySize }, (_, i) => ({
        id: createId('pc'),
        name: `Hero ${i + 1}`,
        playerName: `Player ${i + 1}`,
        level: params.partyLevel,
        class: ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin'][i % 6],
        ancestry: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Half-Orc', 'Tiefling'][i % 6],
        hp: 10 + params.partyLevel * 5,
        maxHp: 10 + params.partyLevel * 5,
        ac: 14 + Math.floor(params.partyLevel / 3),
        abilities: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 10 },
        conditions: [],
      })),
      messages: [{
        id: createId('msg'),
        role: 'gm',
        content: json.openingScene || 'Welcome to your adventure. What do you do?',
        createdAt: nowIso(),
      }],
    };
  } catch {
    return null;
  }
};

// ─── Component ───
export default function App() {
  const [view, setView] = useState<ActiveView>('play');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeId, setActiveId] = useState('');
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [gmThinking, setGmThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Campaign creation wizard state
  const [creationStep, setCreationStep] = useState<CreationStep>('params');
  const [params, setParams] = useState<CampaignParams>({
    genre: 'High Fantasy', tone: 'Heroic & Epic', theme: '', partyLevel: 1, partySize: 4, sessions: 3, hookStyle: HOOKS[0],
  });
  const [promptPreview, setPromptPreview] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<Partial<Campaign> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [llmLogs, setLlmLogs] = useState<LLMLogEntry[]>([]);

  // Load from localStorage
  useEffect(() => {
    const c = ls.get('nv_campaigns') || [];
    setCampaigns(c);
    if (c[0]) setActiveId(c[0].id);
    const logs = ls.get('nv_llm_logs') || [];
    setLlmLogs(logs);
  }, []);

  useEffect(() => { ls.set('nv_campaigns', campaigns); }, [campaigns]);

  const active = useMemo(() => campaigns.find((c) => c.id === activeId) ?? campaigns[0], [campaigns, activeId]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [active?.messages]);

  const addMessage = (campaignId: string, msg: Message) => {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, messages: [...c.messages, msg] } : c));
  };

  const handleDelete = (id: string) => { if (!confirm('Delete?')) return; setCampaigns((prev) => prev.filter((c) => c.id !== id)); setStatus('Deleted.'); };
  const handleDeleteAll = () => { if (!confirm('DELETE ALL?')) return; setCampaigns([]); setStatus('All deleted.'); };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || !input.trim() || gmThinking) return;
    const playerMsg = input.trim();
    addMessage(active.id, { id: createId('msg'), role: 'player', speakerName: active.party[0]?.name, content: playerMsg, createdAt: nowIso() });
    setInput('');
    setStatus('Waiting for GM...');
    await handleGmTurn(active.id, playerMsg);
  };

  const callLlm = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const logEntry: LLMLogEntry = {
      timestamp: nowIso(),
      model: API_MODEL,
      status: 'sent',
      promptLength: systemPrompt.length + userPrompt.length,
      responsePreview: '',
    };
    setLlmLogs((prev) => { const next = [...prev, logEntry]; ls.set('nv_llm_logs', next); return next; });
    const response = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });
    if (!response.ok) throw new Error(`LLM error: ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    setLlmLogs((prev) => {
      const next = prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'success' as const, responsePreview: text.slice(0, 200) } : l);
      ls.set('nv_llm_logs', next);
      return next;
    });
    return text;
  };

  const handleGmTurn = async (campaignId: string, playerMsg: string) => {
    setGmThinking(true);
    setError('');
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) { setGmThinking(false); return; }

    const pc = campaign.party[0];
    const abilityMod = (stat: number) => Math.floor((stat - 10) / 2);
    const abilities = pc ? {
      str: pc.abilities.str || 10, dex: pc.abilities.dex || 10, con: pc.abilities.con || 10,
      int: pc.abilities.int || 10, wis: pc.abilities.wis || 10, cha: pc.abilities.cha || 10,
    } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

    // Build conversation history from last 10 messages
    const history = campaign.messages.slice(-10).map((m) => {
      const who = m.speakerName || m.role;
      return `${who}: ${m.content}`;
    }).join('\n');

    const systemPrompt = `You are the Game Master (GM) for a D&D 5e tabletop RPG. You have absolute authority over the story, world, and rules.

RULES:
- You have FULL memory of the conversation history provided below. Use it to maintain continuity.
- Narrate vividly. Describe settings, NPC reactions, and consequences.
- When a player attempts something risky, you MUST decide what ability check is needed and at what DC.
- Use standard D&D DCs: Easy 10, Medium 12, Hard 15, Very Hard 18, Nearly Impossible 20.
- If the outcome is uncertain, request a roll using this exact format at the END of your response:
  [ROLL:1d20+MODIFIER|Check Name|DC:NUMBER]
  Example: [ROLL:1d20+3|Stealth check to sneak past guards|DC:12]
- If an attack hits, you MUST output damage dealt and remaining HP using this exact format:
  [DAMAGE:Target Name|damage dealt|remaining HP]
  Example: [DAMAGE:Goblin|12|3] means 12 damage dealt, target now has 3 HP left.
- If no roll or damage is needed, do NOT include markers.
- Keep responses concise (3-5 sentences max for narration).`;

    const contextPrompt = `CAMPAIGN: ${campaign.name}
Setting: ${campaign.setting}
Current Scene: ${campaign.currentScene}
Phase: ${campaign.playPhase}
Active Quests: ${campaign.quests.map((q) => q.title).join(', ') || 'None'}

PARTY:
${campaign.party.map((p) => `- ${p.name}: Lvl ${p.level} ${p.ancestry} ${p.class}, HP ${p.hp}/${p.maxHp}, AC ${p.ac}`).join('\n')}

${pc ? `ACTIVE CHARACTER (${pc.name}):
STR ${abilities.str} (${abilityMod(abilities.str) >= 0 ? '+' : ''}${abilityMod(abilities.str)})
DEX ${abilities.dex} (${abilityMod(abilities.dex) >= 0 ? '+' : ''}${abilityMod(abilities.dex)})
CON ${abilities.con} (${abilityMod(abilities.con) >= 0 ? '+' : ''}${abilityMod(abilities.con)})
INT ${abilities.int} (${abilityMod(abilities.int) >= 0 ? '+' : ''}${abilityMod(abilities.int)})
WIS ${abilities.wis} (${abilityMod(abilities.wis) >= 0 ? '+' : ''}${abilityMod(abilities.wis)})
CHA ${abilities.cha} (${abilityMod(abilities.cha) >= 0 ? '+' : ''}${abilityMod(abilities.cha)})` : ''}

NPCS IN SCENE:
${campaign.npcs.map((n) => `- ${n.name} (${n.role}): HP ${n.hp ?? '?'}/${n.maxHp ?? '?'}, AC ${n.ac ?? '?'}, disposition: ${n.disposition}`).join('\n') || 'None'}

--- CONVERSATION HISTORY (you remember all of this) ---
${history || 'No prior messages.'}
--- END HISTORY ---

GM, respond to the player's action. Maintain continuity with the history above. If a roll is needed, include [ROLL:formula|reason|DC:value] at the very end. If you deal damage, include [DAMAGE:Target|damage|remainingHP].`;

    try {
      const gmText = await callLlm(systemPrompt, `${contextPrompt}\n\nPLAYER SAYS: "${playerMsg}"`);

      // Extract and apply damage first
      const damageMatch = gmText.match(/\[DAMAGE:([^|]+)\|(\d+)\|(\d+)\]/);
      if (damageMatch) {
        const targetName = damageMatch[1].trim();
        const dmg = parseInt(damageMatch[2], 10);
        const remHp = parseInt(damageMatch[3], 10);
        // Update NPC HP in campaign state
        setCampaigns((prev) => prev.map((c) => {
          if (c.id !== campaignId) return c;
          const updatedNpcs = c.npcs.map((n) =>
            n.name.toLowerCase() === targetName.toLowerCase() ? { ...n, hp: remHp } : n
          );
          const updatedParty = c.party.map((p) =>
            p.name.toLowerCase() === targetName.toLowerCase() ? { ...p, hp: remHp } : p
          );
          return { ...c, npcs: updatedNpcs, party: updatedParty };
        }));
        addMessage(campaignId, { id: createId('msg'), role: 'system', speakerName: 'Combat', content: `${targetName} takes **${dmg}** damage! Remaining HP: **${remHp}**`, createdAt: nowIso() });
      }

      // Extract roll marker if present
      const rollMatch = gmText.match(/\[ROLL:([^|]+)\|([^|]+)\|DC:(\d+)\]/);
      if (rollMatch && pc) {
        const formula = rollMatch[1].trim();
        const reason = rollMatch[2].trim();
        const dc = parseInt(rollMatch[3], 10);
        const r = roll(formula);
        const success = r.total >= dc;

        addMessage(campaignId, { id: createId('msg'), role: 'gm', speakerName: 'GM', content: gmText.replace(/\[ROLL:[^\]]+\]/, '').replace(/\[DAMAGE:[^\]]+\]/, '').trim(), createdAt: nowIso() });
        addMessage(campaignId, { id: createId('msg'), role: 'system', speakerName: 'Dice', content: `${pc.name} rolls ${formula} for ${reason}: **${r.total}** [${r.dice.join(', ')}] vs DC ${dc} — ${success ? 'SUCCESS' : 'FAILURE'}`, createdAt: nowIso() });
        setStatus(`${success ? 'Success' : 'Failure'} (${r.total} vs DC ${dc})`);

        // Second LLM call: resolve the roll outcome with full history
        const resolveHistory = campaign.messages.slice(-5).map((m) => {
          const who = m.speakerName || m.role;
          return `${who}: ${m.content}`;
        }).join('\n');
        const resolvePrompt = `You are the GM. You have full memory of the conversation.

CONVERSATION HISTORY:
${resolveHistory}

Original GM response: ${gmText}

ROLL RESULT: ${pc.name} rolled ${formula} = ${r.total} vs DC ${dc} → ${success ? 'SUCCESS' : 'FAILURE'}.

Now narrate the final outcome. Describe what happens based on this roll. Be concise (2-4 sentences). If damage is dealt, include [DAMAGE:Target|damage|remainingHP].`;
        const finalText = await callLlm(systemPrompt, resolvePrompt);

        // Parse damage from final response too
        const finalDamageMatch = finalText.match(/\[DAMAGE:([^|]+)\|(\d+)\|(\d+)\]/);
        if (finalDamageMatch) {
          const targetName = finalDamageMatch[1].trim();
          const dmg = parseInt(finalDamageMatch[2], 10);
          const remHp = parseInt(finalDamageMatch[3], 10);
          setCampaigns((prev) => prev.map((c) => {
            if (c.id !== campaignId) return c;
            const updatedNpcs = c.npcs.map((n) =>
              n.name.toLowerCase() === targetName.toLowerCase() ? { ...n, hp: remHp } : n
            );
            const updatedParty = c.party.map((p) =>
              p.name.toLowerCase() === targetName.toLowerCase() ? { ...p, hp: remHp } : p
            );
            return { ...c, npcs: updatedNpcs, party: updatedParty };
          }));
          addMessage(campaignId, { id: createId('msg'), role: 'system', speakerName: 'Combat', content: `${targetName} takes **${dmg}** damage! Remaining HP: **${remHp}**`, createdAt: nowIso() });
        }

        addMessage(campaignId, { id: createId('msg'), role: 'gm', speakerName: 'GM', content: finalText.replace(/\[DAMAGE:[^\]]+\]/, '').trim(), createdAt: nowIso() });
      } else {
        addMessage(campaignId, { id: createId('msg'), role: 'gm', speakerName: 'GM', content: gmText.replace(/\[DAMAGE:[^\]]+\]/, '').trim(), createdAt: nowIso() });
        setStatus('GM responded.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'GM failed';
      setError(msg);
      setStatus('GM error.');
      addMessage(campaignId, { id: createId('msg'), role: 'system', speakerName: 'System', content: `GM error: ${msg}`, createdAt: nowIso() });
    } finally {
      setGmThinking(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ campaigns }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `neoversum-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported.');
  };

  const handleExportLogs = () => {
    const lines = llmLogs.map((l) =>
      `[${l.timestamp}] ${l.status.toUpperCase()} | model=${l.model} | prompt=${l.promptLength}chars | preview="${l.responsePreview.replace(/"/g, "'")}"${l.errorMessage ? ` | error=${l.errorMessage}` : ''}`
    ).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `llm-logs-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    setStatus('LLM logs exported.');
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.campaigns)) { setCampaigns(data.campaigns); setStatus('Imported.'); }
    } catch { setError('Import failed.'); }
    e.target.value = '';
  };

  // ─── Campaign Creation Wizard ───
  const handlePreviewPrompt = () => {
    const prompt = buildCampaignPrompt(params);
    setPromptPreview(prompt);
    setCreationStep('preview');
  };

  const handleGenerate = async () => {
    const logEntry: LLMLogEntry = {
      timestamp: nowIso(),
      model: API_MODEL,
      status: 'sent',
      promptLength: promptPreview.length,
      responsePreview: '',
    };
    setLlmLogs((prev) => { const next = [...prev, logEntry]; ls.set('nv_llm_logs', next); return next; });
    setIsGenerating(true);
    setError('');
    setStatus('Generating campaign with LLM...');
    try {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: API_MODEL,
          messages: [
            { role: 'system', content: 'You are a creative D&D campaign generator. Return only valid JSON.' },
            { role: 'user', content: promptPreview },
          ],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      });
      if (!response.ok) throw new Error(`LLM error: ${response.status}`);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const parsed = parseCampaignResponse(text, params);
      if (!parsed) throw new Error('Failed to parse LLM response. Try again.');
      setGeneratedCampaign(parsed);
      setCreationStep('done');
      setStatus('Campaign generated! Review and confirm.');
      setLlmLogs((prev) => {
        const next = prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'success' as const, responsePreview: text.slice(0, 200) } : l);
        ls.set('nv_llm_logs', next);
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      setStatus('Generation failed.');
      setLlmLogs((prev) => {
        const next = prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'error' as const, errorMessage: msg } : l);
        ls.set('nv_llm_logs', next);
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmCampaign = () => {
    if (!generatedCampaign) return;
    const campaign: Campaign = {
      id: createId('camp'),
      createdAt: nowIso(),
      currentStep: 1,
      maxSteps: params.sessions * 5,
      playPhase: 'roleplay',
      currentRound: 1,
      ...generatedCampaign,
    } as Campaign;
    setCampaigns((prev) => [...prev, campaign]);
    setActiveId(campaign.id);
    setCreationStep('params');
    setGeneratedCampaign(null);
    setPromptPreview('');
    setParams({ genre: 'High Fantasy', tone: 'Heroic & Epic', theme: '', partyLevel: 1, partySize: 4, sessions: 3, hookStyle: HOOKS[0] });
    setView('play');
    setStatus(`Campaign "${campaign.name}" created!`);
  };

  const handleCancelCreation = () => {
    setCreationStep('params');
    setGeneratedCampaign(null);
    setPromptPreview('');
    setStatus('Cancelled.');
  };

  // ─── Views ───
  const renderPlay = () => (
    <section className="play-main">
      {active ? (
        <>
          <div className="panel-heading">
            <div><p className="eyebrow">{active.genre} · {active.tone}</p><h2>{active.name}</h2></div>
            <select value={activeId} onChange={(e) => setActiveId(e.target.value)}>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="play-center">
            {active.setting && (
              <div className="scene-card" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                <p>{active.setting}</p>
              </div>
            )}

            <div className="scene-card">
              <p className="eyebrow">Step {active.currentStep}/{active.maxSteps} · {active.playPhase.toUpperCase()} · Round {active.currentRound}</p>
              <h3>{active.currentScene}</h3>
            </div>

            {active.quests && active.quests.length > 0 && (
              <div className="dice-box">
                <h4>Active Quests</h4>
                {active.quests.map((q) => (
                  <div key={q.id} style={{ marginBottom: '0.5rem' }}>
                    <b>{q.title}</b> <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>[{q.status}]</span>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{q.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div ref={logRef} className="message-log">
              {active.messages.map((m) => (
                <article key={m.id} className={`message ${m.role}`}>
                  <strong>{m.speakerName || m.role.toUpperCase()}</strong>
                  <p>{m.content}</p>
                </article>
              ))}
            </div>

            <form className="action-row" onSubmit={handleSend}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={`What does ${active.party[0]?.name ?? 'your character'} do?`} disabled={gmThinking} />
              <button disabled={!input.trim() || gmThinking} type="submit">{gmThinking ? 'GM Thinking...' : <><Send size={18} /> Send</>}</button>
            </form>
          </div>

          {active.party[0] && (
            <aside className="play-sidebar">
              <div className="state-board">
                <h4>{active.party[0].name}</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Lvl {active.party[0].level} {active.party[0].ancestry} {active.party[0].class}</p>
                <div className="state-board-content compact">
                  <span className="stat-pill">AC {active.party[0].ac}</span>
                  <span className={`stat-pill ${active.party[0].hp <= 0 ? 'danger' : ''}`}>HP {active.party[0].hp}/{active.party[0].maxHp}</span>
                </div>
                <div className="stat-grid">
                  {Object.entries(active.party[0].abilities).map(([stat, val]) => {
                    const mod = Math.floor((val - 10) / 2);
                    return (
                      <div key={stat} className="stat-block" title={`${stat.toUpperCase()}: ${val} (modifier ${mod >= 0 ? '+' : ''}${mod})`}>
                        <span className="stat-name">{stat.toUpperCase()}</span>
                        <span className="stat-value">{val}</span>
                        <span className="stat-mod">{mod >= 0 ? `+${mod}` : mod}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </>
      ) : <p>Create a campaign to start playing.</p>}
    </section>
  );

  const renderCampaignWizard = () => {
    if (creationStep === 'params') {
      return (
        <form className="panel" onSubmit={(e) => { e.preventDefault(); handlePreviewPrompt(); }}>
          <p className="eyebrow">AI Campaign Generator</p>
          <h2>Create a New D&D Campaign</h2>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Tell the AI what kind of story you want. It will generate a complete campaign with quests, NPCs, and session outlines.</p>

          <label>Genre
            <select value={params.genre} onChange={(e) => setParams({ ...params, genre: e.target.value })}>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>

          <label>Tone
            <select value={params.tone} onChange={(e) => setParams({ ...params, tone: e.target.value })}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label>Theme / Keywords
            <input value={params.theme} onChange={(e) => setParams({ ...params, theme: e.target.value })} placeholder="e.g. ancient dragon, cult, betrayal, underwater city" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>Party Level
              <input type="number" min="1" max="20" value={params.partyLevel} onChange={(e) => setParams({ ...params, partyLevel: +e.target.value })} />
            </label>
            <label>Party Size
              <input type="number" min="1" max="8" value={params.partySize} onChange={(e) => setParams({ ...params, partySize: +e.target.value })} />
            </label>
          </div>

          <label>Number of Sessions
            <input type="number" min="1" max="10" value={params.sessions} onChange={(e) => setParams({ ...params, sessions: +e.target.value })} />
          </label>

          <label>Opening Hook
            <select value={params.hookStyle} onChange={(e) => setParams({ ...params, hookStyle: e.target.value })}>
              {HOOKS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>

          <button type="submit"><Wand2 size={18} /> Preview Prompt</button>
        </form>
      );
    }

    if (creationStep === 'preview') {
      return (
        <div className="panel">
          <p className="eyebrow">Review Prompt</p>
          <h2>LLM Prompt Preview</h2>
          <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>This is the prompt that will be sent to the LLM. Review it, then click Generate.</p>
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{promptPreview}</pre>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={handleCancelCreation}>Back</button>
            <button type="button" onClick={() => void handleGenerate()}><Wand2 size={18} /> Generate Campaign</button>
          </div>
        </div>
      );
    }

    if (creationStep === 'generating') {
      return (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <Wand2 size={48} style={{ animation: 'spin 2s linear infinite' }} />
          <h2>Generating Campaign...</h2>
          <p>The AI is writing your story. This may take 10-30 seconds.</p>
        </div>
      );
    }

    if (creationStep === 'done' && generatedCampaign) {
      return (
        <div className="panel">
          <p className="eyebrow">Review Generated Campaign</p>
          <h2>{generatedCampaign.name}</h2>
          <p style={{ opacity: 0.8 }}>{generatedCampaign.genre} · {generatedCampaign.tone}</p>

          {generatedCampaign.setting && (
            <div className="scene-card" style={{ fontSize: '0.9rem' }}>
              <h4>Setting</h4>
              <p>{generatedCampaign.setting}</p>
            </div>
          )}

          <h4>Opening Scene</h4>
          <div className="scene-card">
            <p>{generatedCampaign.currentScene}</p>
          </div>

          {generatedCampaign.npcs && generatedCampaign.npcs.length > 0 && (
            <>
              <h4>Key NPCs</h4>
              <div className="state-list">
                {generatedCampaign.npcs.map((npc) => (
                  <div key={npc.id}>
                    <b>{npc.name}</b> · {npc.role} · <span style={{ color: npc.disposition === 'hostile' ? '#ef4444' : npc.disposition === 'friendly' ? '#22c55e' : '#94a3b8' }}>{npc.disposition}</span>
                    {npc.secret && <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Secret: {npc.secret}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {generatedCampaign.quests && generatedCampaign.quests.length > 0 && (
            <>
              <h4>Quests</h4>
              <div className="state-list">
                {generatedCampaign.quests.map((q) => (
                  <div key={q.id}>
                    <b>{q.title}</b>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{q.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {generatedCampaign.sessions && generatedCampaign.sessions.length > 0 && (
            <>
              <h4>Session Outline</h4>
              {generatedCampaign.sessions.map((s) => (
                <div key={s.id} className="dice-box" style={{ marginBottom: '0.75rem' }}>
                  <h4>Session {s.number}: {s.title}</h4>
                  <p><b>Hook:</b> {s.hook}</p>
                  <p><b>Exploration:</b> {s.exploration}</p>
                  <p><b>Social:</b> {s.social}</p>
                  <p><b>Combat:</b> {s.combat}</p>
                  <p><b>Resolution:</b> {s.resolution}</p>
                </div>
              ))}
            </>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="icon-danger" onClick={handleCancelCreation}>Discard</button>
            <button type="button" onClick={handleConfirmCampaign}><Wand2 size={18} /> Confirm & Create</button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCampaigns = () => (
    <section className="grid two-columns">
      {renderCampaignWizard()}
      <div className="panel">
        <div className="panel-heading">
          <h2>Saved Campaigns</h2>
          {campaigns.length > 0 && <button className="icon-danger" type="button" onClick={handleDeleteAll}><Trash2 size={18} /> Delete All</button>}
        </div>
        <div className="campaign-list">
          {campaigns.map((c) => (
            <article key={c.id} className="campaign-item">
              <button type="button" onClick={() => { setActiveId(c.id); setView('play'); }} style={{ justifyItems: 'start' }}>
                <strong>{c.name}</strong>
                <span>{c.genre} · Step {c.currentStep}/{c.maxSteps} · {new Date(c.createdAt).toLocaleString()}</span>
              </button>
              <button className="icon-danger" type="button" onClick={() => handleDelete(c.id)}><Trash2 size={18} /></button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderJournal = () => (
    <section className="panel">
      <div className="panel-heading">
        <div><p className="eyebrow">Archive</p><h2>Journal</h2></div>
        <div className="toolbar">
          <button type="button" onClick={handleExport}><Download size={18} /> Export</button>
          <button type="button" onClick={handleExportLogs}><Download size={18} /> LLM Logs</button>
          <label className="file-button"><Upload size={18} /> Import<input type="file" accept="application/json" onChange={(e) => void handleImport(e)} /></label>
        </div>
      </div>
      <div className="journal-list">
        {active?.messages.map((m) => (
          <article key={m.id} className="journal-item">
            <span>{new Date(m.createdAt).toLocaleString()} · {m.speakerName || m.role}</span>
            <p>{m.content}</p>
          </article>
        ))}
      </div>
    </section>
  );

  const renderRooms = () => (
    <section className="grid two-columns">
      <div className="panel play-panel">
        <div className="panel-heading"><div><h2>Rooms</h2></div><ShieldCheck /></div>
        <p style={{ padding: '1rem', opacity: 0.7 }}>Multiplayer rooms are disabled in this build. Use Export/Import to share campaigns.</p>
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand"><h1>Neoversum</h1></div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon size={18} /><span>{item.label}</span></button>;
            })}
          </nav>
        </aside>
        <main className="app-main">
          <div className="status-line"><span>{isGenerating ? 'Generating...' : status}</span>{error && <b>{error}</b>}</div>
          {view === 'play' && renderPlay()}
          {view === 'campaigns' && renderCampaigns()}
          {view === 'journal' && renderJournal()}
          {view === 'rooms' && renderRooms()}
        </main>
      </div>
    </div>
  );
}
