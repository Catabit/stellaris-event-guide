# Stellaris Event Guide

An open-source, non-commercial web tool for exploring and simulating Stellaris Astral Rift events. Built for the community, by the community.

## What is this?
This is an interactive guide for Stellaris Astral Rift events. It lets you:
- Browse and simulate all Astral Rift events
- See requirements and rewards
- Plan your choices and see possible paths

## How to Use
- Visit the [GitHub Pages site](https://catabit.github.io/stellaris-event-guide/)
- Select an event from the dropdown
- Tweak your Empire Traits and Event Requirements to lock/unlock different paths through the event
- Use the simulator and reward explorer to plan your playthrough
- Use the wiki links for more details

## How to Contribute
### 1. **Suggest a Fix or Report an Issue**
- Open an [Issue](../../issues) for:
  - Incorrect or missing event text
  - Bugs or UI issues
  - Feature requests
  - Incorrect event logic (missing rewards, wrong options, broken requirements, etc.)
  - Broken/Missing icons/images

### 2. **Edit or Add Events/Rewards/Costs/Requirements**
- All event data is in [`/public/events/*.json`](./public/events)
- Rewards, costs, and requirements are in [`/public/rewards.json`](./public/rewards.json), [`/public/costs.json`](./public/costs.json), [`/public/requirements.json`](./public/requirements.json)
- To add or edit an event:
  1. Copy an existing event JSON as a template
  2. Update the `id`, `name`, and `nodes` structure
  3. Add a `wiki_url` for reference
  4. Make sure all referenced rewards/costs/requirements exist in their respective files
  5. Add the new event in the event list in [`/src/App.tsx`](./src/App.tsx)
  6. Submit a pull request with your changes

#### **Event JSON Structure**
- `id`: unique event identifier
- `name`: display name
- `banner_url`: banner image URL
- `wiki_url`: link to the Stellaris Wiki section
- `nodes`: array of event nodes, each with:
  - `id`: node id (unique per event)
  - `text`: node text
  - `choices`: array of choices, each with:
    - `id` (unique per node)
    - `text`: choice text
    - `next` and `failure_next` (other node id or `null` if it ends the rift)
    - `reward` (array of reward IDs)
    - `costs` (array of cost IDs)
    - `requirements` (boolean expression of requirement IDs)
    - etc.

#### **Rewards/Costs/Requirements**
- Each is a JSON object with an id and a `text` field (and optional extra fields)
- Add new entries as needed, keeping ids unique

#### **Icons**
- Text fields for rewards, costs and requirements support icons from [`/public/icons.json`](./public/icons.json) via the `{{icon_id}}` substitution
- Icons are sourced from the Stellaris Wiki

#### **Requirements**
- Requirement text in event choices (`requirements` field) need to be a boolean string composed with requirement IDs from [`/public/requirements.json`](./public/requirements.json), paranthesis and the `and, or, not` keywords
- When computing requirements for a reward, all boolean requirement strings down the path are `ANDed` together

### 3. **Run Locally**
```bash
npm install
npm run dev
```

### 4. **Build & Deploy**
```bash
npm run build
npm run deploy
```

## License & Credits
This is a non-commercial fan-made tool for Stellaris.
Stellaris and all associated content, including names, event text, icons, and images, are © Paradox Interactive.
"Stellaris" is a trademark of Paradox Interactive.
This project is not affiliated with or endorsed by Paradox Interactive.
