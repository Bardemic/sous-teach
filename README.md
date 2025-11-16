# sous-teach

## The Problem

### Teacher Workload, Burnout, and Churn 

- Long hours
- Student behavior
- Administrative drain
- Teacher to student ratio

### Lesson-Planning Bottleneck

### Importance of Personalized Learning

## Our Solution

## How We Built It

## Challenges We Faced

## Development

docker run -d \
  --name souschef-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=souschef \
  -p 5432:5432 \
  -v souschef_pgdata:/var/lib/postgresql/data \
  postgres:16
  `
