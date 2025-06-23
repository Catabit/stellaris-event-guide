import type { Reward, Cost } from "./types";
import { getIconUrl } from "./iconUtils";
import React, { useEffect, useState } from "react";

export const RewardCostIcon: React.FC<{ iconKey: string }> = ({ iconKey }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getIconUrl(iconKey).then(setUrl);
  }, [iconKey]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ width: 18, height: 18, objectFit: "contain" }}
      data-icon-key={iconKey}
      className="stellaris-text-icon"
    />
  );
};

export function parseTextWithIcons(text: string): React.ReactNode {
  const regex = /\{\{([a-zA-Z0-9_\-]+)\}\}/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  const nodes: React.ReactNode[] = [];
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<RewardCostIcon iconKey={match[1]} key={`icon-${key++}`} />);
    lastIndex = regex.lastIndex;
  }
  if (nodes.length === 0) {
    return text;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return <>{nodes}</>;
}

export function renderRewardList(
  rewardIds: string[] | undefined,
  rewards: Record<string, Reward>
) {
  if (!rewardIds || rewardIds.length === 0) return null;

  return (
    <>
      {rewardIds.map((rId) => (
        <div key={rId} className="text-reward reward-list-item">
          <span className="reward-icon">+</span>
          {rewards[rId]?.text
            ? parseTextWithIcons(rewards[rId].text)
            : `[${rId}]`}
        </div>
      ))}
    </>
  );
}

export function renderCostList(
  costIds: string[] | undefined,
  costs: Record<string, Cost>
) {
  if (!Array.isArray(costIds)) return null;

  return (
    <>
      {costIds.map((cId) => (
        <div key={cId} className="text-cost cost-list-item">
          <span className="cost-icon">-</span>
          {costs[cId]?.text
            ? parseTextWithIcons(costs[cId].text)
            : `[${cId}]`}
        </div>
      ))}
    </>
  );
}