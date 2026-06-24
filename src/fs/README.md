# MythWeaver File System

Per-campaign file organization. Each campaign is a self-contained directory of files.

## Directory Layout

```
campaign/{campaignId}/
  shared.json           -- world state, scene, public messages, votes, quests
  players/
    {playerId}.json     -- profile + character + private messages + personal state
  npcs/
    {npcId}.json        -- NPC stats + AI section (GM-only editable)
```

## File Responsibilities

| File | Owner | Contents |
|------|-------|----------|
| `shared.json` | GM | Scene, phase, step, clocks, quests, public messages, vote data, party roster IDs |
| `players/{id}.json` | Player | Profile, character sheet, private GM messages, personal inventory/gold |
| `npcs/{id}.json` | GM | NPC stats, AI behavior section, disposition, triggers, combat tactics |

## Visibility Rules

- **shared.json**: readable by all; writable by GM only
- **players/{id}.json**: readable by owner + GM; writable by owner
- **npcs/{id}.json**: readable by GM only; NPCs revealed to players show only name+role

## localStorage Keys

```
mw_shared_{campaignId}       -> shared.json
mw_player_{campaignId}_{playerId} -> players/{playerId}.json
mw_npc_{campaignId}_{npcId}  -> npcs/{npcId}.json
```

## Communication Scenarios

| Scenario | Stored In | Visibility |
|----------|-----------|------------|
| Public chat | `shared.json` messages array | All players |
| Voting | `shared.json` votes array | All players; tallies public |
| Private to GM | `players/{id}.json` privateMessages | Owner + GM only |
| Hidden action | `shared.json` pendingActions with `hidden: true` | Shows as `[?]` to others |

## NPC Lifecycle

| Timing | Action |
|--------|--------|
| Campaign start | Pre-generate mini-boss/boss NPCs → `npcs/` |
| Scene trigger (market, etc.) | GM clicks "Generate NPC" → LLM API → `npcs/` (temporary) |
| GM promotes | Temporary NPC marked persistent in `npcs/{id}.json` |

## Data Flow

```
Player Action
  → POST to shared.json pendingActions (queued for GM)
GM Resolve
  → LLM API call
  → Update shared.json scene/quests
  → Remove from pendingActions
  → Add narration to shared.json messages
```
