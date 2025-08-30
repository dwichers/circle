# Circle

<br />
<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

<br />
<br />

Project management interface inspired by Linear. Built with Next.js and shadcn/ui, this application allows tracking of issues, projects and teams with a modern, responsive UI.

## 🛠️ Technologies

- **Framework**: [Next.js](https://nextjs.org/)
- **Langage**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### 📦 Installation

```shell
git clone https://github.com/ln-dev7/circle.git
cd circle
```

### Install dependencies

```shell
pnpm install
```

### Start the development server

```shell
pnpm dev
```

### WebSocket broadcast test

Start the API server:

```bash
pnpm dev:server
```

In another terminal, open a WebSocket connection:

```bash
npx wscat -c ws://localhost:3000
```

Use `curl` to mutate tasks and observe the broadcast:

```bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task"}'

# Update a task
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Renamed"}'

# Complete a task
curl -X POST http://localhost:3000/tasks/1/complete
```

Each call broadcasts a message like:

```json
{"event":"tasks.updated","payload":{"type":"create","task":{...}}}
```

## Star History

<a href="https://www.star-history.com/#ln-dev7/circle&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date" />
 </picture>
</a>
