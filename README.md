# sous-teach



`
docker run -d \
  --name souschef-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=souschef \
  -p 5432:5432 \
  -v souschef_pgdata:/var/lib/postgresql/data \
  postgres:16
  `