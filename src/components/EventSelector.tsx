import React from "react";
import "../css/StellarisTheme.css"

type Props = {
  current: string;
  options: { id: string; name: string }[];
  onChange: (eventId: string) => void;
};

const EventSelector: React.FC<Props> = ({ current, options, onChange }) => {
  return (
    <div className="stellaris-panel">
      <div className="stellaris-panel-header">
        Select Event
      </div>
      <div className="stellaris-panel-body">
        <select
          id="event-select"
          className="form-select"
          value={current}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EventSelector;
