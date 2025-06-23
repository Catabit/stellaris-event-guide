// @ts-nocheck
import fs from 'fs';
import path from 'path';
import type { RiftEvent, EventNode, EventNodeChoice } from '../src/data/types';

function getAllEventFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dir, f));
}

function loadJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectRefsFromChoice(choice: EventNodeChoice, refs: { costs: Set<string>, requirements: Set<string>, rewards: Set<string> }) {
  if (choice.costs) choice.costs.forEach(c => refs.costs.add(c));
  if (choice.requirements) {
    // requirements can be a string like 'not genocidal and gestalt_consciousness'
    // split on 'and', 'or', 'not', and whitespace, then filter to known requirement keys
    const reqs = choice.requirements.split(/\band\b|\bor\b|\bnot\b|[()]/g)
      .map(s => s.trim())
      .filter(Boolean);
    reqs.forEach(r => refs.requirements.add(r));
  }
  if (choice.reward) choice.reward.forEach(rw => refs.rewards.add(rw));
}

function collectRefsFromNode(node: EventNode, refs: { costs: Set<string>, requirements: Set<string>, rewards: Set<string> }) {
  if (node.reward) node.reward.forEach(rw => refs.rewards.add(rw));
  if (node.choices) {
    node.choices.forEach(choice => collectRefsFromChoice(choice, refs));
  }
}

describe('Event data references', () => {
  const projectRoot = path.resolve(__dirname, '../');
  const eventsDir = path.join(projectRoot, 'public/events');
  const rewards = loadJson(path.join(projectRoot, 'public/rewards.json'));
  const costs = loadJson(path.join(projectRoot, 'public/costs.json'));
  const requirements = loadJson(path.join(projectRoot, 'public/requirements.json'));

  const eventFiles = getAllEventFiles(eventsDir);
  const summary = [];

  if (eventFiles.length === 0) {
    it('No event files found', () => {
      expect(eventFiles.length).toBeGreaterThan(0);
    });
    return;
  }

  for (const file of eventFiles) {
    it(`All references in ${path.basename(file)} exist`, () => {
      const event: RiftEvent = loadJson(file);
      const refs = { costs: new Set<string>(), requirements: new Set<string>(), rewards: new Set<string>() };
      if (event.nodes) {
        event.nodes.forEach(node => collectRefsFromNode(node, refs));
      }
      const missing = { costs: [], requirements: [], rewards: [] };
      for (const c of refs.costs) {
        if (!costs[c]) missing.costs.push(c);
      }
      for (const r of refs.requirements) {
        if (!requirements.static[r] && !requirements.dynamic[r]) missing.requirements.push(r);
      }
      for (const rw of refs.rewards) {
        if (!rewards[rw]) missing.rewards.push(rw);
      }
      if (missing.costs.length || missing.requirements.length || missing.rewards.length) {
        summary.push({ file: path.basename(file), ...missing });
      }
      expect(missing.costs.length).toBe(0);
      expect(missing.requirements.length).toBe(0);
      expect(missing.rewards.length).toBe(0);
    });
  }

  afterAll(() => {
    if (summary.length) {
      // eslint-disable-next-line no-console
      console.log('\n==== Missing Reference Summary ====' );
      for (const entry of summary) {
        console.log(`File: ${entry.file}`);
        if (entry.costs.length) console.log('  Costs:', entry.costs);
        if (entry.requirements.length) console.log('  Requirements:', entry.requirements);
        if (entry.rewards.length) console.log('  Rewards:', entry.rewards);
      }
      console.log('==== End of Summary ====' );
    }
  });
});
