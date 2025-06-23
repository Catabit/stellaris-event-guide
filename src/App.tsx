import React, { useEffect, useState } from "react";
import { Parser } from "expr-eval";
import type { RiftEvent, Reward, Cost, OutcomeGroup } from "./data/types";
import { loadEvent } from "./data/eventLoader";
import EventSelector from "./components/EventSelector";
import Simulator from "./components/Simulator";
import RequirementSelector from "./components/RequirementsSelector";
import OutcomeSelector from "./components/OutcomeSelector";
import { computeSignificantOutcomePathsGrouped } from './utils/pathfinder';
import "./css/StellarisTheme.css";

const eventOptions = [
  { id: "ruined_planet", name: "Ruined Planet" },
  { id: "genesis", name: "Genesis" },
  { id: "strange_station", name: "Strange Station" },
  { id: "the_microverse", name: "The Microverse" },
  { id: "entertainment_nexus", name: "Entertainment Nexus" },
  { id: "the_crystal_rift", name: "The Crystal Rift" },
  { id: "psionic_stranger", name: "Psionic Stranger" },
  { id: "siege_on_paradise", name: "Siege on Paradise" },
  { id: "abandoned_complex", name: "Abandoned Complex" },
  { id: "bleached_planet", name: "Bleached Planet" },
  { id: "chemical_wasteland", name: "Chemical Wasteland" },
  { id: "desert_ruins", name: "Desert Ruins" },
  { id: "dimensional_conflict", name: "Dimensional Conflict" },
  { id: "dimensional_dump", name: "Dimensional Dump" },
  { id: "entangled_dark_matter", name: "Entangled Dark Matter" },
  { id: "hatching_ground", name: "Hatching Ground" },
  { id: "lone_object", name: "Lone Object" },
  { id: "rockworms", name: "Rockworms" },
  { id: "subnautical", name: "Subnautical" },
  { id: "the_advisor", name: "The Advisor" },
  { id: "the_corridors", name: "The Corridors" },
  { id: "the_fluid", name: "The Fluid" },
  { id: "the_garden", name: "The Garden" },
  { id: "the_lattice", name: "The Lattice" },
  { id: "the_mechanism", name: "The Mechanism" },
  { id: "the_tower", name: "The Tower" },
  { id: "the_vortex", name: "The Vortex" },
  { id: "tiny_planet", name: "Tiny Planet" },
  { id: "tropical_habitat", name: "Tropical Habitat" },
  { id: "volcanic_plane", name: "Volcanic Plane" },
  { id: "whiteout", name: "Whiteout" },
  { id: "windswept_planet", name: "Windswept Planet" }
];

const App: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState(eventOptions[eventOptions.length - 1].id);
  const [eventData, setEventData] = useState<RiftEvent | null>(null);
  const [history, setHistory] = useState<string[]>(["start"]);
  const currentNodeId = history[history.length - 1];
  const [rewards, setRewards] = useState<Record<string, Reward>>({});
  const [costs, setCosts] = useState<Record<string, Cost>>({});
  const [requirementsRaw, setRequirementsRaw] = useState<any>({ static: {}, dynamic: {} });
  const [staticSelected, setStaticSelected] = useState<Set<string>>(new Set());
  const [dynamicSelected, setDynamicSelected] = useState<Set<string>>(new Set());
  const [groupedOutcomes, setGroupedOutcomes] = useState<Record<string, OutcomeGroup>>({});
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | string[])[] | null>(null);
  const [selectedPathRequirements, setSelectedPathRequirements] = useState<string[]>([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "requirements.json")
      .then((res) => res.json())
      .then((data) => setRequirementsRaw(data));
  }, []);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "costs.json")
      .then((res) => res.json())
      .then((data) => setCosts(data));
  }, []);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "rewards.json")
      .then((res) => res.json())
      .then((data) => setRewards(data));
  }, []);

  useEffect(() => {
    if (eventData && Object.keys(rewards).length > 0) {
      const grouped = computeSignificantOutcomePathsGrouped(eventData, rewards);
      setGroupedOutcomes(grouped);
      setSelectedGroupKey(null);
    }
  }, [eventData, rewards]);

  useEffect(() => {
    window.history.replaceState({ riftHistory: history }, "", window.location.href);
  }, []);

  const handleChoice = (nextNodeId: string) => {
    const newHistory = [...history, nextNodeId];

    window.history.pushState(
      { riftHistory: newHistory },
      "",
      window.location.href
    );

    setHistory(newHistory);
  };

  const handleRestart = () => {
    window.history.replaceState(
      { riftHistory: ["start"] },
      "",
      window.location.href
    );
    setHistory(["start"]);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await loadEvent(selectedEventId);
        setEventData(data);
        window.history.replaceState(
          { riftHistory: ["start"] },
          "",
          window.location.href
        );
        setHistory(["start"]);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [selectedEventId]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const restored = e.state?.riftHistory;
      if (Array.isArray(restored)) {
        setHistory(restored);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function extractIdentifiers(expr: string): string[] {
    try {
      const parsed = Parser.parse(expr);
      return parsed.variables();
    } catch {
      return [];
    }
  }

  function getAllDynamicTraitsUsedInEvent(event: RiftEvent): string[] {
    const allTraits = new Set<string>();
    event.nodes.forEach((node) => {
      node.choices?.forEach((choice) => {
        extractIdentifiers(choice.requirements ?? "").forEach((trait) => {
          if (trait in (requirementsRaw.dynamic || {})) {
            allTraits.add(trait);
          }
        });
      });
    });
    return Array.from(allTraits);
  }

  const toggleStatic = (traitId: string) => {
    setStaticSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(traitId) ? newSet.delete(traitId) : newSet.add(traitId);
      return newSet;
    });
  };

  const toggleDynamic = (traitId: string) => {
    setDynamicSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(traitId) ? newSet.delete(traitId) : newSet.add(traitId);
      return newSet;
    });
  };

  return (
    <>
      <div className="stellaris-main">
        <div className="stellaris-main-header">
          <h1>Stellaris Astral Rift Helper</h1>
        </div>
        <div className="stellaris-main-grid">
          <div className="stellaris-main-grid-event-simulator-group">
            <div className="stellaris-main-box stellaris-event-selector">
              <EventSelector
                current={selectedEventId}
                options={eventOptions}
                onChange={setSelectedEventId}
              />
            </div>
            <div className="stellaris-main-box stellaris-simulator">
              {eventData && (
                <Simulator
                  event={eventData}
                  currentNodeId={currentNodeId}
                  onChoose={handleChoice}
                  rewards={rewards}
                  costs={costs}
                  userTraits={new Set([...staticSelected, ...dynamicSelected])}
                  selectedPath={selectedPath}
                  onRestart={handleRestart}
                />
              )}
            </div>
          </div>
          <div className="stellaris-main-box stellaris-outcome-selector">
            <OutcomeSelector
              groupedOutcomes={groupedOutcomes}
              rewards={rewards}
              costs={costs}
              requirements={requirementsRaw}
              selectedGroupKey={selectedGroupKey}
              setSelectedGroupKey={setSelectedGroupKey}
              selectedPathIndex={selectedPathIndex}
              setSelectedPathIndex={setSelectedPathIndex}
              setSelectedPath={setSelectedPath}
              setSelectedPathRequirements={setSelectedPathRequirements}
              staticSelected={staticSelected}
            />
          </div>
          <div className="stellaris-main-box stellaris-requirements-selector">
            {eventData && (
              <RequirementSelector
                staticSelected={staticSelected}
                onToggleStatic={toggleStatic}
                dynamicAvailable={getAllDynamicTraitsUsedInEvent(eventData)}
                dynamicSelected={dynamicSelected}
                onToggleDynamic={toggleDynamic}
                dynamicLabelMap={requirementsRaw.dynamic || {}}
                highlighted={selectedPathRequirements}
              />
            )}
          </div>
        </div>
      </div>
      <footer className="stellaris-footer">
        Icons and background images © Paradox Interactive, sourced from the <a href="https://stellaris.paradoxwikis.com/" target="_blank" rel="noopener noreferrer">Stellaris Wiki</a>. Event descriptions and choice text are property of Paradox Interactive. This is a non-commercial fan-made guide tool and is not affiliated with or endorsed by Paradox Interactive.
      </footer>
    </>
  );
};

export default App;
