# sudo docker start tryora-postgres tryora-redis

# docker run -d --name tryora-redis -p 6379:6379 redis:alpine && \
# docker run -d --name tryora-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tryora -p 5432:5432 postgres:alpine


(docker start tryora-redis 2>/dev/null || docker run -d --name tryora-redis -p 6379:6379 redis:alpine) && \
(docker start tryora-postgres 2>/dev/null || docker run -d --name tryora-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tryora -p 5432:5432 postgres:alpine)

# docker stop tryora-redis tryora-postgres

uvicorn app.main:app --host 0.0.0.0 --port 8888 --reload

# . ./scripts/start.sh