ai-server-project/
├── app/
│   ├── api/                # API Layer: Request/Response handling
│   │   ├── v1/             # Versioning is critical for scale
│   │   │   ├── endpoints/  # Specific routes (chat, scrape, search)
│   │   │   └── api.py      # Router aggregator for v1
│   ├── core/               # Global configuration & security
│   │   ├── config.py       # Pydantic Settings (env vars, API keys)
│   │   ├── security.py     # Auth, JWT, and Encryption
│   │   └── logging.py      # Structured logging setup
│   ├── db/                 # Database initialization & session management
│   │   ├── base.py         # SQLAlchemy Base for models
│   │   └── session.py      # Async DB engine & session maker
│   ├── domains/            # THE CORE: Domain-specific logic
│   │   ├── reasoning/      # LLM logic, Chains, Agents
│   │   ├── scraping/       # Scraper engines, parsers
│   │   └── search/         # Search engine integration (Serper, DuckDuckGo)
│   ├── models/             # SQLAlchemy/SQLModel database tables
│   ├── schemas/            # Pydantic models for validation
│   ├── services/           # Cross-domain business logic (orchestrators)
│   ├── worker/             # Background tasks (Celery/RQ) for long AI jobs
│   └── main.py             # App entry point
├── tests/                  # Pytest suite mirroring app structure
├── alembic/                # Database migrations
├── docker/                 # Dockerfiles & deployment configs
├── .env                    # Secrets (Not committed!)
└── pyproject.toml          # Dependency management (Poetry/Pip)
