pdlpropertyinspector

## Server: dev vs production

Development (fast, runs TypeScript with ts-node):

```cmd
set REDIS_URL=redis://localhost:6379
npm run start:server
```

Production (compile then run compiled server):

```cmd
set REDIS_URL=redis://localhost:6379
npm run start:server:prod
```

Notes:
- `start:server` uses the ts-node ESM loader for local iteration.
- `start:server:prod` runs `tsc` then starts the compiled server in `dist/`.
