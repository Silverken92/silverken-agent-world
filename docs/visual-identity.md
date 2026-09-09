# SilverKen Visual Identity

AW4 gives Agent World a distinct SilverKen product identity without forking the upstream rendering engine more than necessary.

## Design rule

The visual layer is intentionally additive:

```text
upstream Bot Crossing HUD / Three.js engine
                ↓
      src/ui/silverken.css
      src/ui/silverken-brand.js
                ↓
       SilverKen Agent World
```

This is a maintenance decision as much as a design decision. Large rewrites of `hud.js` or the render loop would make every upstream sync harder to review and more likely to introduce regressions.

## Product language

The UI presents Agent World as a **governed operations surface** rather than a generic game dashboard.

Brand header:

```text
SK  SILVERKEN
    AGENT WORLD

GOVERNED VIEW               READ ONLY
```

The read-only label is not decorative: it reinforces the architecture boundary established by Agency Agent ADR-0014 and the Agent World integration contract.

## Palette

The skin uses a dark graphite/navy base with silver text, violet identity accents and cyan operational highlights.

| Token | Intent |
| --- | --- |
| graphite/navy | background and control surfaces |
| silver | primary text / neutral identity |
| violet | SilverKen product identity / selected state |
| cyan | live/read-only system signal |
| green | active work |
| blue | needs input |
| red | failed/blocked |
| amber | released/shipped |

The palette is applied through CSS variables so the inherited HUD and controls continue to use their existing state machinery.

## Status vocabulary

The underlying colony state keys stay compatible with upstream. AW4 changes only the operator-facing labels:

| Internal colony key | SilverKen label |
| --- | --- |
| `working` | active |
| `waiting` | needs input |
| `blocked` | failed |
| `celebrating` | released |
| `agents` | agents |

This avoids changing navigation/filter behavior while using vocabulary closer to Agency Agent operations.

## Branding layer

`src/ui/silverken-brand.js` performs small DOM-level substitutions after the upstream HUD is created:

- replaces the visible Bot Crossing brand with the SilverKen mark;
- adds the governed/read-only status strip;
- updates the boot and help titles;
- adds the governance explanation to Help;
- changes `repo` vocabulary to `project` where practical;
- changes `New conversation` to `New session`;
- changes the visible top-level status labels.

A `MutationObserver` keeps dynamic upstream HUD text branded after subsequent polling updates. The updater is idempotent and avoids redundant DOM writes.

## What AW4 does not change

AW4 does **not**:

- rewrite the Three.js world;
- replace upstream astronaut or environment assets;
- change the harness contract;
- change status precedence;
- create new authority or mutation paths;
- alter Agency Agent security/release semantics.

This keeps the performance-sensitive colony engine and upstream asset credits intact.

## Future role language

AW5 may enrich the selected-agent card with authoritative read-only metadata for:

- SilverFlow / orchestrator;
- builder/specialist role;
- QA / evaluator;
- SilverGuard;
- release readiness;
- GitHub PR / CI evidence.

Those additions should use the same palette and should remain context, not a second source of truth.
