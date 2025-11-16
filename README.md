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

```bash
# 1. Start Postgres
docker run -d \
  --name souschef-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=souschef \
  -p 5432:5432 \
  -v souschef_pgdata:/var/lib/postgresql/data \
  postgres:16

# 2. Install dependencies
npm install

# 3. Create packages/backend/.env with your API keys
# OPENROUTER_API_KEY=your-key
# EXA_API_KEY=your-key
# SENDGRID_API_KEY=your-key (get from sendgrid.com)
# SENDGRID_FROM_EMAIL=your-email@domain.com

# 4. Run migrations
npm run migrate:up

# 5. Start dev servers
npm run dev
```
