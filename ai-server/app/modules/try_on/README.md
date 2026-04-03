# Generation Router

Five-tier fallback cascade for avatar GLB generation.

## Files

```
app/modules/try_on/
├── generation_router.py          ← orchestrator (drop this in)
├── workers.py                    ← updated Celery task (replaces existing)
└── providers/
    ├── smplx_provider.py         ← Tier 1: local CPU, free
    └── hf_provider.py            ← Tier 2: HuggingFace Spaces, free
```

## Tier summary

| Tier | Provider          | Cost     | Speed  | Requires               |
|------|-------------------|----------|--------|------------------------|
| 0    | Redis / S3 cache  | $0       | <50ms  | nothing (always first) |
| 1    | SMPL-X local CPU  | $0       | ~10s   | tHeight + tFullness    |
| 2    | HF Spaces ZeroGPU | $0       | ~60s   | image + gradio_client  |
| 3    | Tripo AI          | ~$0.01   | ~30s   | image + TRIPO_API_KEY  |
| 4    | Pre-baked template| $0       | <1s    | DressTemplate in DB    |

## Setup

### Tier 1 — SMPL-X

```bash
pip install smplx torch trimesh
# Download free model weights (registration required):
# https://smpl-x.is.tue.mpg.de → SMPLX_NEUTRAL.npz
mkdir -p ./models/smplx
# Place SMPLX_NEUTRAL.npz in ./models/smplx/
# Or set: SMPLX_MODEL_PATH=/path/to/weights
```

### Tier 2 — HuggingFace Spaces

```bash
pip install gradio_client
# No API key needed for public Spaces on free ZeroGPU tier
# Default Space: akhaliq/PIFuHD
# To use your own: set hf_provider = HFProvider("your-user/your-space")
```

### Tier 3 — Tripo AI

Already integrated. Just set `TRIPO_API_KEY` in your `.env`.

### Tier 4 — Pre-baked templates

Already built via the `prebake` module. Run:

```bash
python scripts/seed_templates.py
```

## How the router decides

The router tries each tier in order and moves to the next on ANY exception:

```
Cache hit?       → return immediately
tH+tF available? → try SMPL-X  (fail silently → next)
image available? → try HF       (fail silently → next)
image available? → try Tripo    (fail silently → next)
always           → use template (last resort, never fails)
```

The `result.provider` field tells you which tier won — logged and stored
in the job's Redis/DB status so you can see the distribution over time.

## Cost estimation

With a typical user base where:
- 80% of users have body measurements → 80% served by Tier 0/1 ($0)
- 15% have a photo but no measurements → Tier 2 (HF, $0) or Tier 3 (Tripo, ~$0.01)
- 5% have neither → Tier 4 template ($0)

Expected cost per 1000 calls ≈ $1.50 (Tripo credits only)
