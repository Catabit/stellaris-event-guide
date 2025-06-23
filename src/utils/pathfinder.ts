import type { RiftEvent, Reward, OutcomePath, OutcomeGroup } from '../data/types';
import { Parser } from "expr-eval";

export function extractRequirementIds(expr: string): string[] {
  try {
    const parsed = Parser.parse(expr);
    return parsed.variables();
  } catch {
    return [];
  }
}

function makeSignificantRewardKey(significant: string[], all_rewards: Record<string, number>): string {
  return significant
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map(id => `${id}:${all_rewards[id] ?? 0}`)
    .join('|');
}

function collapseChoicePaths(paths: string[][]): (string | string[])[] {
  const maxLength = Math.max(...paths.map(p => p.length));
  const result: (string | string[])[] = [];

  for (let i = 0; i < maxLength; i++) {
    const stepChoices = paths.map(p => p[i]).filter(Boolean);
    const unique = Array.from(new Set(stepChoices));
    result.push(unique.length === 1 ? unique[0] : unique);
  }

  return result;
}

export function computeSignificantOutcomePathsGrouped(
  event: RiftEvent,
  rewards: Record<string, Reward>
): Record<string, OutcomeGroup> {
  const nodeMap = Object.fromEntries(event.nodes.map(n => [n.id, n]));
  const pathList: (OutcomePath & { requirementExprs?: string[] })[] = [];

  function dfs(
    nodeId: string,
    nodePath: string[],
    choicePath: string[],
    allRewards: Record<string, number>,
    allCosts: Record<string, number>,
    requirements: Set<string>,
    requirementExprs: Set<string>,
    significant: Set<string>
  ) {
    const node = nodeMap[nodeId];
    if (!node || !node.choices || node.choices.length === 0) {
      pathList.push({
        node_path: [...nodePath, nodeId],
        choice_path: [...choicePath],
        all_rewards: { ...allRewards },
        all_costs: { ...allCosts },
        requirements: Array.from(requirements),
        requirementExprs: Array.from(requirementExprs),
        significant_rewards: Array.from(significant)
      });
      return;
    }

    for (const choice of node.choices) {
      const newNodePath = [...nodePath, nodeId];
      const newChoicePath = [...choicePath, choice.id];
      const newRewards = { ...allRewards };
      const newCosts = { ...allCosts };
      const newRequirements = new Set(requirements);
      const newRequirementExprs = new Set(requirementExprs);
      const newSignificant = new Set(significant);

      for (const r of choice.reward ?? []) {
        newRewards[r] = (newRewards[r] ?? 0) + 1;
        if (rewards[r]?.significant) {
          newSignificant.add(r);
        }
      }

      for (const c of choice.costs ?? []) {
        newCosts[c] = (newCosts[c] ?? 0) + 1;
      }

      if (typeof choice.requirements === 'string' && choice.requirements != "") {
        newRequirementExprs.add(choice.requirements);
        try {
          const parsed = Parser.parse(choice.requirements);
          parsed.variables().forEach(id => newRequirements.add(id));
        } catch (err) {
          console.warn("Failed to parse requirements:", choice.requirements);
        }
      }

      const nextNode = choice.next;
      if (nextNode) {
        dfs(nextNode, newNodePath, newChoicePath, newRewards, newCosts, newRequirements, newRequirementExprs, newSignificant);
      } else {
        pathList.push({
          node_path: [...newNodePath],
          choice_path: [...newChoicePath],
          all_rewards: newRewards,
          all_costs: newCosts,
          requirements: Array.from(newRequirements),
          requirementExprs: Array.from(newRequirementExprs),
          significant_rewards: Array.from(newSignificant)
        });
      }
    }
  }

  dfs('start', [], [], {}, {}, new Set(), new Set(), new Set());

  const grouped: Record<string, OutcomeGroup> = {};

  for (const path of pathList) {
    if (path.significant_rewards.length === 0) continue;

    const key = makeSignificantRewardKey(path.significant_rewards, path.all_rewards);
    if (!grouped[key]) {
      grouped[key] = {
        groupKey: key,
        all_rewards: Object.fromEntries(
          path.significant_rewards.map(rid => [rid, path.all_rewards[rid]])
        ),
        significant: path.significant_rewards,
        paths: []
      };
    }

    grouped[key].paths.push({ ...path, collapsedChoicePath: [] });
  }

  for (const group of Object.values(grouped)) {
    const bySecondaryRewards: Record<string, typeof group.paths> = {};
    for (const path of group.paths) {
      const secondaryEntries = Object.entries(path.all_rewards)
        .filter(([rid]) => !group.significant.includes(rid))
        .sort(([a], [b]) => a.localeCompare(b));
      const secondaryKey = secondaryEntries.map(([rid, n]) => `${rid}:${n}`).join('|');
      if (!bySecondaryRewards[secondaryKey]) bySecondaryRewards[secondaryKey] = [];
      bySecondaryRewards[secondaryKey].push(path);
    }
    const final: OutcomeGroup['paths'] = [];
    for (const groupPaths of Object.values(bySecondaryRewards)) {
      const byRequirements: Record<string, typeof groupPaths> = {};
      for (const path of groupPaths) {
        const key = path.requirements.slice().sort().join('|');
        if (!byRequirements[key]) byRequirements[key] = [];
        byRequirements[key].push(path);
      }
      for (const reqPaths of Object.values(byRequirements)) {
        const collapsed = collapseChoicePaths(reqPaths.map(p => p.choice_path));
        const rep = reqPaths[0];
        final.push({ ...rep, collapsedChoicePath: collapsed });
      }
    }
    group.paths = final;
  }

  return grouped;
}