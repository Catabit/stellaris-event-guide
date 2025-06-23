import React, { useState, useEffect } from "react";
import { Parser } from "expr-eval";
import { parseTextWithIcons } from "../data/renderUtils";
import type { OutcomeGroup, Reward, Cost } from "../data/types";
import "../css/StellarisTheme.css"
import "../css/OutcomeSelector.css"

interface OutcomeSelectorProps {
  groupedOutcomes: Record<string, OutcomeGroup>;
  rewards: Record<string, Reward>;
  costs: Record<string, Cost>;
  requirements: any;
  selectedGroupKey: string | null;
  setSelectedGroupKey: (key: string | null) => void;
  selectedPathIndex: number | null;
  setSelectedPathIndex: (idx: number | null) => void;
  setSelectedPath: (path: (string | string[])[] | null) => void;
  setSelectedPathRequirements: (reqs: string[]) => void;
  staticSelected: Set<string>;
}

function isPossibleWithStatic(expr: string, staticSelected: Set<string>, staticKeys: string[]): boolean {
  if (!expr || expr.trim() === "") return true;
  try {
    const parsed = Parser.parse(expr);
    const vars = parsed.variables();

    const staticContext: Record<string, any> = {};
    for (const v of vars) {
      if (staticKeys.includes(v)) {
        staticContext[v] = staticSelected.has(v) as unknown as import("expr-eval").Value;
      }
    }

    const dynamicVars = vars.filter(v => !staticKeys.includes(v));
    if (dynamicVars.length === 0) {
      return !!parsed.evaluate(staticContext);
    }
    const combos = 1 << dynamicVars.length;
    for (let i = 0; i < combos; ++i) {
      const ctx = { ...staticContext };
      dynamicVars.forEach((v, idx) => {
        ctx[v] = !!(i & (1 << idx)) as unknown as import("expr-eval").Value;
      });
      if (parsed.evaluate(ctx)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

const OutcomeSelector: React.FC<OutcomeSelectorProps> = ({
  groupedOutcomes,
  rewards,
  costs,
  requirements,
  selectedGroupKey,
  setSelectedGroupKey,
  selectedPathIndex,
  setSelectedPathIndex,
  setSelectedPath,
  setSelectedPathRequirements,
  staticSelected,
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [showHiddenVariants, setShowHiddenVariants] = useState<Set<string>>(new Set());
  const staticKeys = Object.keys(requirements.static || {});

  useEffect(() => {
    setShowHidden(false);
    setShowHiddenVariants(new Set());
  }, [groupedOutcomes]);

  useEffect(() => {
    setShowHiddenVariants(new Set());
  }, [selectedGroupKey]);

  const visibleEntries = Object.entries(groupedOutcomes).filter(([_, group]) =>
    group.paths.some(path => {
      const exprs = path.requirementExprs ?? [""];
      return exprs.length === 0 || exprs.some(expr => !expr || expr.trim() === "") || exprs.every(expr => isPossibleWithStatic(expr, staticSelected, staticKeys));
    })
  );
  const hiddenEntries = Object.entries(groupedOutcomes).filter(([_, group]) =>
    !group.paths.some(path => {
      const exprs = path.requirementExprs ?? [""];
      return exprs.length === 0 || exprs.some(expr => !expr || expr.trim() === "") || exprs.every(expr => isPossibleWithStatic(expr, staticSelected, staticKeys));
    })
  );
  function renderOutcomeEntry(key: string, group: OutcomeGroup, isHidden: boolean) {
    const isExpanded = selectedGroupKey === key;
    const significant = group.significant.map(rid => rewards[rid]?.text ? parseTextWithIcons(rewards[rid].text) : rid);
    const allReqs = group.paths.map(p => (p.requirementExprs ?? []).join('&&'));
    const allCosts = group.paths.map(p => JSON.stringify(p.all_costs));
    const uniqueReqs = Array.from(new Set(allReqs));
    const uniqueCosts = Array.from(new Set(allCosts));
    const showReqsOnMain = uniqueReqs.length === 1;
    const showCostsOnMain = uniqueCosts.length === 1;
    const mainReqs = showReqsOnMain ? group.paths[0].requirementExprs : null;
    const mainCosts = showCostsOnMain ? group.paths[0].all_costs : null;
    return (
      <div
        key={group.groupKey}
        className={`stellaris-primary-list-item rounded${isExpanded ? ' selected' : ''}${isHidden ? ' hidden-by-static' : ''}`}
        onClick={() => {
          if (isExpanded) {
            setSelectedGroupKey(null);
            setSelectedPath(null);
            setSelectedPathRequirements([]);
            setSelectedPathIndex(null);
          } else {
            setSelectedGroupKey(key);
            setSelectedPath(null);
            setSelectedPathRequirements([]);
            setSelectedPathIndex(null);
          }
        }}
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {/* Rewards */}
        <div className="stellaris-option-list-block">
          {significant.map((reward, i) => (
            <div key={i} className="reward-list-item text-reward">
              <span className="reward-icon">+</span>
              {reward}
            </div>
          ))}
        </div>
        {/* Requirements */}
        {showReqsOnMain && mainReqs && mainReqs.length > 0 ? (
          <div className="stellaris-option-text-block">
            <strong>Requirements: </strong>
            <span className="stellaris-option-requirements-text">
              {mainReqs.length === 1
                ? mainReqs[0].split(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g).map((token, j) => {
                  const isRequirement = requirements.static?.[token] || requirements.dynamic?.[token];
                  return isRequirement && isRequirement.text
                    ? <span key={j}>{parseTextWithIcons(isRequirement.text)}</span>
                    : <span key={j}>{token}</span>;
                })
                : mainReqs.map((expr, i) => (
                  <span key={i}>
                    {'('}
                    {expr.split(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g).map((token, j) => {
                      const isRequirement = requirements.static?.[token] || requirements.dynamic?.[token];
                      return isRequirement && isRequirement.text
                        ? <span key={j}>{parseTextWithIcons(isRequirement.text)}</span>
                        : <span key={j}>{token}</span>;
                    })}
                    {')'}
                    {i < mainReqs.length - 1 ? ' and ' : ''}
                  </span>
                ))}
            </span>
          </div>
        ) : !showReqsOnMain ? (
          <div className="stellaris-option-text-block">
            <strong>Requirements: </strong>
            <span className="stellaris-option-requirements-text">Varies</span>
          </div>
        ) : null}
        {/* Costs */}
        {showCostsOnMain && mainCosts && Object.keys(mainCosts).length > 0 ? (
          <div className="stellaris-option-list-block">
            {Object.entries(mainCosts).map(([cid, n]) => (
              <div key={cid} className="cost-list-item text-cost">
                <span className="cost-icon">-</span>
                {n}x {costs[cid]?.text ? parseTextWithIcons(costs[cid].text) : cid}
              </div>
            ))}
          </div>
        ) : !showCostsOnMain ? (
          <div className="stellaris-option-text-block">
            <strong>Costs: </strong>
            <span className="stellaris-option-requirements-text text-cost">Varies</span>
          </div>
        ) : null}
        {/* Step 2: Variant selection for this group, as a nested list inside the main outcome */}
        {isExpanded && (
          <div className="stellaris-variant-list">
            {(() => {
              const visibleVariants = group.paths.filter((path) => {
                const exprs = path.requirementExprs ?? [""];
                return exprs.length === 0 || exprs.some(expr => !expr || expr.trim() === "") || exprs.some(expr => isPossibleWithStatic(expr, staticSelected, staticKeys));
              });
              const hiddenVariants = group.paths.filter((path) => {
                const exprs = path.requirementExprs ?? [""];
                return !(
                  exprs.length === 0 || exprs.some(expr => !expr || expr.trim() === "") || exprs.some(expr => isPossibleWithStatic(expr, staticSelected, staticKeys))
                );
              });
              const showHidden = showHiddenVariants.has(group.groupKey);
              return (
                <>
                  {visibleVariants.map((path, idx) => renderVariant(path, idx, false, group, showReqsOnMain, showCostsOnMain))}
                  {hiddenVariants.length > 0 && (
                    <div
                      className="stellaris-hidden-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        setShowHiddenVariants(prev => {
                          const next = new Set(prev);
                          if (next.has(group.groupKey)) next.delete(group.groupKey);
                          else next.add(group.groupKey);
                          return next;
                        });
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={showHidden}
                    >
                      {showHidden
                        ? `Hide ${hiddenVariants.length} reward${hiddenVariants.length > 1 ? "s" : ""} hidden by Empire Traits`
                        : `Show ${hiddenVariants.length} reward${hiddenVariants.length > 1 ? "s" : ""} hidden by Empire Traits`}
                    </div>
                  )}
                  {showHidden && hiddenVariants.map((path, idx) => renderVariant(path, idx + visibleVariants.length, true, group, showReqsOnMain, showCostsOnMain))}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  function renderVariant(
    path: any, 
    idx: number,
    isHidden: boolean,
    group: OutcomeGroup,
    showReqsOnMain: boolean,
    showCostsOnMain: boolean
  ) {
    const secondaryRewards = Object.entries(path.all_rewards)
      .filter(([rid]) => !group.significant.includes(rid))
      .map(([rid, count]) => ({
        text: (
          <>
            {count}x {rewards[rid]?.text ? parseTextWithIcons(rewards[rid].text) : rid}
          </>
        )
      }));
    return (
      <div
        key={idx}
        className={`stellaris-variant-list-item${selectedPathIndex === idx ? ' selected' : ''}${isHidden ? ' hidden-by-static' : ''}`}
        role="button"
        tabIndex={0}
        aria-selected={selectedPathIndex === idx}
        onClick={e => {
          e.stopPropagation();
          if (selectedPathIndex === idx) {
            setSelectedPath(null);
            setSelectedPathRequirements([]);
            setSelectedPathIndex(null);
            (e.currentTarget as HTMLElement).blur();
          } else {
            setSelectedPath(path.collapsedChoicePath);
            setSelectedPathRequirements(path.requirements);
            setSelectedPathIndex(idx);
          }
        }}
      >
        {/* Rewards */}
        {secondaryRewards.length > 0 && (
          <div className="stellaris-option-list-block">
            {secondaryRewards.map((r, i) => (
              <div key={i} className="reward-list-item text-reward">
                <span className="reward-icon">+</span>
                {r.text}
              </div>
            ))}
          </div>
        )}
        {/* Requirements */}
        {!showReqsOnMain && Array.isArray(path.requirementExprs) && path.requirementExprs.length > 0 && (
          <div className="stellaris-option-text-block">
            <strong>Requirements: </strong>
            <span className="stellaris-option-requirements-text">
              {path.requirementExprs.length === 1
                ? path.requirementExprs[0].split(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g).map((token: string, j: number) => {
                  const isRequirement = requirements.static?.[token] || requirements.dynamic?.[token];
                  return isRequirement && isRequirement.text
                    ? <span key={j}>{parseTextWithIcons(isRequirement.text)}</span>
                    : <span key={j}>{token}</span>;
                })
                : path.requirementExprs.map((expr: string, i: number) => (
                  <span key={i}>
                    {'('}
                    {expr.split(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g).map((token: string, j: number) => {
                      const isRequirement = requirements.static?.[token] || requirements.dynamic?.[token];
                      return isRequirement && isRequirement.text
                        ? <span key={j}>{parseTextWithIcons(isRequirement.text)}</span>
                        : <span key={j}>{token}</span>;
                    })}
                    {')'}
                    {Array.isArray(path.requirementExprs) && i < path.requirementExprs.length - 1 ? ' and ' : ''}
                  </span>
                ))}
            </span>
          </div>
        )}
        {/* Costs */}
        {!showCostsOnMain && Object.keys(path.all_costs).length > 0 && (
          <div className="stellaris-option-list-block">
            {Object.entries(path.all_costs).map(([cid, n]) => (
              <div key={cid} className="cost-list-item text-cost">
                <span className="cost-icon">-</span>
                {n as number}x {costs[cid]?.text ? parseTextWithIcons(costs[cid].text) : cid}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const visibleElements = visibleEntries.map(([key, group]) => renderOutcomeEntry(key, group, false));
  const hiddenElements = showHidden ? hiddenEntries.map(([key, group]) => renderOutcomeEntry(key, group, true)) : [];

  return (
    <div className="stellaris-panel">
      <div className="stellaris-panel-header">
        <span>Possible Rewards</span>
      </div>
      <div className="stellaris-outcome-panel">
        {visibleElements}
        {hiddenEntries.length > 0 && (
          <div className="stellaris-hidden-toggle" onClick={() => setShowHidden(v => !v)} tabIndex={0} role="button" aria-expanded={showHidden}>
            {showHidden
              ? `Hide ${hiddenEntries.length} reward${hiddenEntries.length > 1 ? "s" : ""} hidden by Empire Traits`
              : `Show ${hiddenEntries.length} reward${hiddenEntries.length > 1 ? "s" : ""} hidden by Empire Traits`}
          </div>
        )}
        {hiddenElements}
      </div>
    </div>
  );
};

export default OutcomeSelector;
