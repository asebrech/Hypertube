# Hypertube

A web app for the 21th century

### To launch the project using Turbo and PNPM:

```bash
cp ./apps/back/.env.example ./apps/back/.env && cp ./apps/front/.env.example ./apps/front/.env #dont forget to change the .env for turbo
```

```bash
docker compose up db -d
```

```bash
pnpm run dev
```

### To launch the project with docker:

```bash
cp ./apps/back/.env.example ./apps/back/.env && cp ./apps/front/.env.example ./apps/front/.env
```

```bash
docker compose up -d
```
