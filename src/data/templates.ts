export interface StoryTemplate {
  id: string;
  title: string;
  genre: string;
  tone: string;
  premise: string;
  openingScene: string;
  playerGoal: string;
  maxSteps: number;
  licenseId: string;
  locations: Array<{ id: string; name: string }>;
  factions: Array<{ id: string; name: string }>;
  threats: Array<{ id: string; name: string }>;
  npcs: Array<{ id: string; name: string; role: string }>;
  chapters: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    beats: Array<{
      id: string;
      name: string;
      description: string;
      possibleScenes?: string[];
    }>;
  }>;
}

const goblinKeep: StoryTemplate = {
  id: 'goblin-keep',
  title: 'Goblin Keep of Blackpine Road',
  genre: 'Heroic fantasy',
  tone: 'Gritty',
  premise: 'A frontier keep under siege by goblin warbands.',
  openingScene: 'The keep walls loom against a grey sky. Torchlight flickers on the battlements as the alarm horn sounds.',
  playerGoal: 'Defend the keep and break the siege.',
  maxSteps: 12,
  licenseId: 'cc-by-4.0',
  locations: [
    { id: 'loc1', name: 'The Keep Walls' },
    { id: 'loc2', name: 'Blackpine Forest' },
    { id: 'loc3', name: 'The Undercroft' },
  ],
  factions: [
    { id: 'fac1', name: "Lord's Guard" },
    { id: 'fac2', name: 'Goblin Warband' },
  ],
  threats: [
    { id: 'th1', name: 'Goblin Siege' },
    { id: 'th2', name: 'Supply Shortage' },
  ],
  npcs: [
    { id: 'npc1', name: 'Captain Aldric', role: 'Guard Captain' },
    { id: 'npc2', name: 'Snarltooth', role: 'Goblin Chieftain' },
    { id: 'npc3', name: 'Sister Mira', role: 'Cleric' },
  ],
  chapters: [
    {
      id: 'ch1',
      name: 'The Siege Begins',
      type: 'action',
      description: 'Goblins swarm the walls. Hold the line.',
      beats: [
        { id: 'b1', name: 'Alarm', description: 'The alarm horn sounds. Man the walls.', possibleScenes: ['Rush to the gate', 'Rally the militia'] },
        { id: 'b2', name: 'First Wave', description: 'Goblins scale the walls. Fight them back.', possibleScenes: ['Melee on the battlements', 'Archery from towers'] },
      ],
    },
    {
      id: 'ch2',
      name: 'Into the Forest',
      type: 'exploration',
      description: 'Scout the goblin camp. Gather intel.',
      beats: [
        { id: 'b3', name: 'Woods at Night', description: 'Navigate the dark pines.', possibleScenes: ['Stealth approach', 'Ambush a patrol'] },
      ],
    },
  ],
};

export const storyTemplates: StoryTemplate[] = [goblinKeep];

export const getTemplate = (id: string): StoryTemplate | undefined => storyTemplates.find((t) => t.id === id);
