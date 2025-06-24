import React from "react";
import { Parser } from "expr-eval";
import type { Value } from "expr-eval";
import type { RiftEvent, EventNode, Reward, Cost } from "../data/types";
import { renderRewardList, renderCostList } from "../data/renderUtils";
import "../css/StellarisTheme.css";
import "../css/Simulator.css";

type Props = {
    event: RiftEvent;
    currentNodeId: string;
    onChoose: (nextNodeId: string) => void;
    rewards: Record<string, Reward>;
    costs: Record<string, Cost>;
    userTraits: Set<string>;
    selectedPath?: (string | string[])[] | null;
    onRestart: () => void;
};

function isChoiceVisible(requirementsExpr: string | undefined, userTraits: Set<string>): boolean {
    if (!requirementsExpr || requirementsExpr == "") return true;

    try {
        const context: Record<string, Value> = {};
        for (const trait of userTraits) {
            context[trait] = true as unknown as Value;
        }

        const parsed = Parser.parse(requirementsExpr);
        const allVars = parsed.variables();

        const fullContext: Record<string, Value> = {};
        for (const v of allVars) {
            fullContext[v] = context[v] ?? false;
        }

        return parsed.evaluate(fullContext);
    } catch (err) {
        console.warn("Invalid requirements expression:", requirementsExpr);
        console.error(err);
        return false;
    }
}

const Simulator: React.FC<Props> = ({ event, currentNodeId, onChoose, rewards, costs, userTraits, selectedPath, onRestart }) => {
    const node: EventNode | undefined = event.nodes.find((n) => n.id === currentNodeId);
    const bannerUrl = (event as any).banner_url || "";
    if (!node) return <div className="alert alert-danger">Node not found: {currentNodeId}</div>;

    return (
        <div className="stellaris-panel">
            <div className="stellaris-panel-body">
                <div className="stellaris-sim">
                    {bannerUrl && (
                        <div>
                            <div className="stellaris-sim-banner-wrap">
                                <img src={bannerUrl} alt="Banner" className="stellaris-sim-banner" />
                            </div>
                            <div className="stellaris-separator" />
                        </div>
                    )}
                    <div className="stellaris-sim-node-title">{node.text}</div>
                    <div className="stellaris-separator" />
                    <ul className="stellaris-sim-choice-list">
                        {node.choices.filter(choice => isChoiceVisible(choice.requirements, userTraits)).map((choice) => {
                            const isInSelectedPath = selectedPath?.some(step =>
                                Array.isArray(step) ? step.includes(choice.id) : step === choice.id
                            );
                            const nextNode = choice.next ? event.nodes.find((n) => n.id === choice.next) : null;
                            const isEnding = !choice.next || nextNode?.choices.length === 0;
                            return (
                                <li key={choice.id} className="stellaris-sim-choice-item">
                                    <button
                                        className={`stellaris-sim-choice-btn${selectedPath ? isInSelectedPath ? ' chosen' : ' not-chosen' : ''}`}
                                        onClick={() => {
                                            if (choice.next) onChoose(choice.next);
                                        }}
                                    >
                                        <div className="stellaris-sim-choice-btn-grid">
                                            <div className="stellaris-sim-choice-btn-row1">
                                                <span className="stellaris-sim-choice-btn-maintext">{isInSelectedPath ? '★ ' : ''}{choice.text}</span>
                                                {choice.failure_next && (
                                                    <button
                                                        className="stellaris-sim-fail-btn"
                                                        tabIndex={-1}
                                                        type="button"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            onChoose(choice.failure_next!);
                                                        }}
                                                    >
                                                        Fail
                                                    </button>
                                                )}
                                            </div>
                                            <div className="stellaris-separator" />
                                            <div className="stellaris-sim-choice-btn-row2">
                                                {renderRewardList(choice.reward, rewards)}
                                            </div>
                                            <div className="stellaris-sim-choice-btn-row3">
                                                {renderCostList(choice.costs, costs)}
                                            </div>
                                            {isEnding && (
                                                <div className="stellaris-sim-choice-btn-row4 stellaris-sim-warning">⚠ This choice will end the event.</div>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                        <li key="restart" className="stellaris-sim-choice-item">
                            <button className="stellaris-sim-choice-btn restart" onClick={onRestart}>
                                Go to Start
                            </button>
                        </li>
                    </ul>
                </div>

                {event.wiki_url && (
                    <div className="stellaris-sim-wiki-footer">
                        <a href={event.wiki_url} target="_blank" rel="noopener noreferrer">View on Stellaris Wiki ↗</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulator;
