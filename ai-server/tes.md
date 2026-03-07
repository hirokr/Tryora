POST /internal/ai/search-dresses
  │  prompt="beach wedding maxi", geo="Miami, FL"
  │
  ├─ Creates DressSearch (PENDING) in Postgres
  ├─ Returns {task_id, search_id} immediately (202)
  └─ Dispatches Celery task ──────────────────────────────────────────────────┐
                                                                              ▼
                                                              Celery Worker process
                                                ┌──────────────────────────────────────┐
                                                │ 1. Status → PROCESSING               │
                                                │ 2. xAI → DressSearchParams JSON      │
                                                │ 3. Embed params → ChromaDB query     │
                                                │    cache hit? → link + DONE          │
                                                │ 4. build_shopping_query()            │
                                                │    → Serper Shopping API             │
                                                │ 5. ScraperAPI → JSON-LD (fallback)   │
                                                │ 6. xAI formatter → DressProductSchema│
                                                │ 7. Save Postgres + upsert ChromaDB   │
                                                │ 8. Status → COMPLETED                │
                                                │    redis.publish("search:<task_id>") │
                                                └──────────────────────────────────────┘

WS /internal/ai/ws/status/{task_id}
  │  Client subscribes after receiving task_id
  └─ Waits on Redis "search:<task_id>" channel → forwards JSON payload when received


  
cd ai-server
celery -A app.worker.celery_app.celery_app worker --loglevel=info

cd ai-server
prisma generate
prisma migrate dev --name add_dress_search