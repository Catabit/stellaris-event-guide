export type RewardID = string;

export type Reward = {
  text: string;
  significant?: boolean;
};

export type CostID = string;

export type Cost = {
  text: string;
};

export type EventNodeChoice = {
  id: string;
  text: string;
  next: string | null;
  failure_next?: string | null;
  reward?: string[];
  costs?: string[];
  requirements?: string;
};

export type EventNode = {
  id: string;
  text: string;
  choices: EventNodeChoice[];
  reward?: RewardID[];
  notes?: string;
};

export type RiftEvent = {
  id: string;
  name: string;
  nodes: EventNode[];
  banner_url?: string;
  wiki_url?: string;
};

export type OutcomePath = {
  significant_rewards: string[];
  all_rewards: Record<string, number>;
  all_costs: Record<string, number>;
  requirements: string[];
  choice_path: string[];
  node_path: string[];
};

export type OutcomeGroup = {
  groupKey: string;
  all_rewards: Record<string, number>;
  significant: string[];
  paths: (OutcomePath & {
    collapsedChoicePath: (string | string[])[];
    requirementExprs?: string[];
  })[];
};