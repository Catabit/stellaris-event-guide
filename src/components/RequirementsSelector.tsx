import React, { useState } from "react";
import { parseTextWithIcons } from "../data/renderUtils";
import { getIconUrl } from "../data/iconUtils";
import "../css/StellarisTheme.css"
import "../css/RequirementsSelector.css";

// ETHICS WHEEL CONSTANTS
const ETHICS = [
  { key: "egalitarian", fanatic: "fanatic_egalitarian" },
  { key: "materialist", fanatic: "fanatic_materialist" },
  { key: "pacifist", fanatic: "fanatic_pacifist" },
  { key: "xenophile", fanatic: "fanatic_xenophile" },
  { key: "authoritarian", fanatic: "fanatic_authoritarian" },
  { key: "spiritualist", fanatic: "fanatic_spiritualist" },
  { key: "militarist", fanatic: "fanatic_militarist" },
  { key: "xenophobe", fanatic: "fanatic_xenophobe" },
];
const GESTALT = { key: "gestalt_consciousness" };
const MODERATE_SPREAD = "2.5rem";
const FANATIC_SPREAD = "4.5rem";

const ETHIC_LABELS: Record<string, string> = {
  egalitarian: "Egalitarian",
  fanatic_egalitarian: "Fanatic Egalitarian",
  materialist: "Materialist",
  fanatic_materialist: "Fanatic Materialist",
  pacifist: "Pacifist",
  fanatic_pacifist: "Fanatic Pacifist",
  xenophile: "Xenophile",
  fanatic_xenophile: "Fanatic Xenophile",
  authoritarian: "Authoritarian",
  fanatic_authoritarian: "Fanatic Authoritarian",
  spiritualist: "Spiritualist",
  fanatic_spiritualist: "Fanatic Spiritualist",
  militarist: "Militarist",
  fanatic_militarist: "Fanatic Militarist",
  xenophobe: "Xenophobe",
  fanatic_xenophobe: "Fanatic Xenophobe",
  gestalt_consciousness: "Gestalt Consciousness"
};

const RequirementIcon: React.FC<{ iconKey: string; title?: string }> = ({ iconKey, title }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    getIconUrl(iconKey).then(setUrl);
  }, [iconKey]);
  if (!url) return <span style={{ width: 20, height: 20, display: 'inline-block' }} />;
  return (
    <img
      src={url}
      alt={title || ""}
      title={title}
      data-icon-key={iconKey}
      className="stellaris-requirement-img"
    />
  );
}

function areOpposed(e1: string, e2: string) {
  // Opposing pairs: 0-4, 1-5, 2-6, 3-7
  const idx1 = ETHICS.findIndex(e => e.key === e1 || e.fanatic === e1);
  const idx2 = ETHICS.findIndex(e => e.key === e2 || e.fanatic === e2);
  if (idx1 === -1 || idx2 === -1) return false;
  return (idx1 + 4) % 8 === idx2;
}

const EthicsWheel: React.FC<{
  onToggle: (key: string) => void;
  highlighted: string[];
}> = ({ onToggle, highlighted }) => {
  const [ethics] = useState<Set<string>>(new Set());
  function isHighlighted(key: string) {
    return highlighted.includes(key);
  }
  function isSelected(key: string) {
    return ethics.has(key);
  }
  function isDisabled(key: string) {
    if (key === GESTALT.key) return ethics.size > 0 && !ethics.has(GESTALT.key);
    if (ethics.has(GESTALT.key)) return true;
    if (ETHICS.some(e => e.fanatic === key && !ethics.has(key) && !ethics.has(e.key)) && ethics.size >= 2) return true;
    if (ETHICS.some(e => (e.key === key || e.fanatic === key) && !ethics.has(key)) && ethics.size >= 3) return true;
    return Array.from(ethics).some(sel => areOpposed(sel, key));
  }
  function canSelect(key: string) {
    if (isSelected(key)) return true;
    if (key === GESTALT.key) return ethics.size === 0;
    if (ETHICS.some(e => e.fanatic === key)) {
      const base = ETHICS.find(e => e.fanatic === key)?.key;
      if (!base) return false;
      if (ethics.has(base)) return ethics.size <= 2;
      return ethics.size <= 1;
    }
    if (ethics.size < 3) return true;
    return false;
  }
  function toggleEthic(key: string) {
    onToggle(key);
    ethics.has(key) ? ethics.delete(key) : ethics.add(key);
    if (ETHICS.some(e => e.fanatic === key)) {
      const base = ETHICS.find(e => e.fanatic === key)?.key;
      if (base && !ethics.has(base)) {
        onToggle(base);
        ethics.has(base) ? ethics.delete(base) : ethics.add(base);
      }
    } else if (ETHICS.some(e => e.key === key)) {
      const fanatic = ETHICS.find(e => e.key === key)?.fanatic;
      if (fanatic && ethics.has(fanatic)) {
        onToggle(fanatic);
        ethics.has(fanatic) ? ethics.delete(fanatic) : ethics.add(fanatic);
      }
    }
  }
  function handleClick(key: string) {
    if (!canSelect(key)) return;
    toggleEthic(key);
  }
  return (
    <div className="stellaris-ethics-wheel" style={{ padding: `${FANATIC_SPREAD}` }}>
      {ETHICS.map((e, i) => {
        const angle = i * 45;
        return (
          <React.Fragment key={e.key}>
            <div
              className={`stellaris-ethics-icon ethics-normal${isSelected(e.key) ? " selected" : ""}${isDisabled(e.key) ? " disabled" : ""}${isHighlighted(e.key) ? " highlighted" : ""}`}
              style={{
                transform: `rotate(${angle}deg) translate(${MODERATE_SPREAD}) rotate(-${angle}deg)`
              }}
              onClick={() => handleClick(e.key)}
            >
              <RequirementIcon iconKey={e.key} title={ETHIC_LABELS[e.key]} />
            </div>
            <div
              className={`stellaris-ethics-icon ethics-fanatic${isSelected(e.fanatic) ? " selected" : ""}${isDisabled(e.fanatic) ? " disabled" : ""}${isHighlighted(e.fanatic) ? " highlighted" : ""}`}
              style={{
                transform: `rotate(${angle}deg) translate(${FANATIC_SPREAD}) rotate(-${angle}deg)`
              }}
              onClick={() => handleClick(e.fanatic)}
            >
              <RequirementIcon iconKey={e.fanatic} title={ETHIC_LABELS[e.fanatic]} />
            </div>
          </React.Fragment>
        );
      })}
      <div
        className={`stellaris-ethics-icon ethics-center${isSelected(GESTALT.key) ? " selected" : ""}${isDisabled(GESTALT.key) ? " disabled" : ""}${isHighlighted(GESTALT.key) ? " highlighted" : ""}`}
        onClick={() => handleClick(GESTALT.key)}
      >
        <RequirementIcon iconKey={GESTALT.key} title={ETHIC_LABELS[GESTALT.key]} />
      </div>
    </div>
  );
};

interface StaticProps {
  selected: Set<string>;
  onToggle: (reqId: string) => void;
  highlighted: string[];
}

const StaticRequirementSelector: React.FC<StaticProps> = ({
  selected,
  onToggle,
  highlighted,
}) => {
  function isHighlighted(key: string) {
    return highlighted.includes(key);
  }
  function isDisabled(key: string) {
    // TODO: Check if machine and toxoid are mutually exclusive
    if (key === "machine") return selected.has("biological") || selected.has("lithoid");
    if (key === "biological") return selected.has("machine");

    if (key === "aquatic") return selected.has("lithoid");
    if (key === "lithoid") return selected.has("aquatic") || selected.has("machine");

    if (key === "genocidal") return !selected.has("fanatic_xenophobe") || (!selected.has("militarist") && !selected.has("spiritualist"));
    if (key === "barbaric_despoilers") return selected.has("xenophile") || !selected.has("militarist") || (!selected.has("authoritarian") && !selected.has("xenophobe"));

    return false;
  }
  function isSelected(key: string) {
    return selected.has(key);
  }
  function handleClick(key: string) {
    if (key === "lithoid" && !selected.has("biological"))
      onToggle("biological");

    onToggle(key);
  }

  return (
    <div className="stellaris-panel">
      <div className="stellaris-panel-header">Empire Traits</div>
      <div className="stellaris-panel-body stellaris-static-requirements-body">
        <EthicsWheel onToggle={onToggle} highlighted={highlighted} />
        <div className="stellaris-separator" />
        <div className="requirements-selector-list stellaris-species-requirements">
          <div className={`requirements-static-selector-item${isSelected("aquatic") ? " selected" : ""}${isDisabled("aquatic") ? " disabled" : ""}${isHighlighted("aquatic") ? " highlighted" : ""}`} onClick={() => handleClick("aquatic")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="aquatic" /><RequirementIcon iconKey="waterproof" /></div>
            <div><span>Aquatic<br />Waterproof</span></div>
          </div>
          <div className={`requirements-static-selector-item${isSelected("lithoid") ? " selected" : ""}${isDisabled("lithoid") ? " disabled" : ""}${isHighlighted("lithoid") ? " highlighted" : ""}`} onClick={() => handleClick("lithoid")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="lithoid" /></div>
            <div><span>Lithoid</span></div>
          </div>
          <div className={`requirements-static-selector-item${isSelected("biological") ? " selected" : ""}${isDisabled("biological") ? " disabled" : ""}${isHighlighted("biological") ? " highlighted" : ""}`} onClick={() => handleClick("biological")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="biological" /></div>
            <div><span>Biological</span></div>
          </div>
          <div className={`requirements-static-selector-item${isSelected("machine") ? " selected" : ""}${isDisabled("machine") ? " disabled" : ""}${isHighlighted("machine") ? " highlighted" : ""}`} onClick={() => handleClick("machine")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="machine" /> </div>
            <div><span>Machine</span></div>
          </div>
          <div className={`requirements-static-selector-item${isSelected("toxoid") ? " selected" : ""}${isDisabled("toxoid") ? " disabled" : ""}${isHighlighted("toxoid") ? " highlighted" : ""}`} onClick={() => handleClick("toxoid")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="toxoid" /> </div>
            <div><span>Toxoid</span></div>
          </div>
        </div>
        <div className="stellaris-separator" />
        <div className="requirements-selector-list stellaris-other-requirements">
          <div className={`requirements-static-selector-item${isSelected("barbaric_despoilers") ? " selected" : ""}${isDisabled("barbaric_despoilers") ? " disabled" : ""}${isHighlighted("barbaric_despoilers") ? " highlighted" : ""}`} onClick={() => handleClick("barbaric_despoilers")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="barbaric_despoilers" /></div>
            <div><span>Barbaric<br />Despoilers</span></div>
          </div>
          <div className={`requirements-static-selector-item${isSelected("genocidal") ? " selected" : ""}${isDisabled("genocidal") ? " disabled" : ""}${isHighlighted("genocidal") ? " highlighted" : ""}`} onClick={() => handleClick("genocidal")}>
            <div className="requirements-static-selector-item-icons"><RequirementIcon iconKey="fanatic_purifier" /><RequirementIcon iconKey="devouring_swarm" /><RequirementIcon iconKey="determined_exterminator" /></div>
            <div><span>Genocidal</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DynamicProps {
  available: string[];
  selected: Set<string>;
  onToggle: (reqId: string) => void;
  labelMap: Record<string, { text: string }>;
  highlighted: string[];
}

const DynamicRequirementSelector: React.FC<DynamicProps> = ({
  available,
  selected,
  onToggle,
  labelMap,
  highlighted,
}) => {
  if (!available || available.length === 0) {
    return null;
  }
  return (
    <div className="stellaris-panel">
      <div className="stellaris-panel-header">Event Requirements</div>
      <div className="stellaris-panel-body">
        <div className="requirements-selector-list">
          {available.map((req) => (
            <div key={req} className={`requirements-dynamic-selector-item${selected.has(req) ? " selected" : ""}${highlighted.includes(req) ? " highlighted" : ""}`} onClick={() => onToggle(req)}>
              <div><span>
                {labelMap[req]?.text
                  ? parseTextWithIcons(labelMap[req].text)
                  : req}
              </span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface Props {
  staticSelected: Set<string>;
  onToggleStatic: (reqId: string) => void;
  dynamicAvailable: string[];
  dynamicSelected: Set<string>;
  onToggleDynamic: (reqId: string) => void;
  dynamicLabelMap: Record<string, { text: string }>;
  highlighted: string[];
}

const RequirementSelector: React.FC<Props> = ({
  staticSelected,
  onToggleStatic,
  dynamicAvailable,
  dynamicSelected,
  onToggleDynamic,
  dynamicLabelMap,
  highlighted,
}) => {
  return (
    <React.Fragment>
      <StaticRequirementSelector
        selected={staticSelected}
        onToggle={onToggleStatic}
        highlighted={highlighted}
      />
      <DynamicRequirementSelector
        available={dynamicAvailable}
        selected={dynamicSelected}
        onToggle={onToggleDynamic}
        labelMap={dynamicLabelMap}
        highlighted={highlighted}
      />
      {/* <div>
        {Array.from(staticSelected).map(req => (req + " "))}
        {Array.from(dynamicSelected).map(req => (req + " "))}
      </div> */}
    </React.Fragment>
  );
};

export default RequirementSelector;
