## MyFree Agent

MyFree Agent is a browser-first personal AI companion that runs completely on the client. It uses a lightweight open-source model (`LaMini-Flan-T5-77M`) via [`@xenova/transformers`](https://github.com/xenova/transformers.js), so conversations stay private and no API keys or paid services are required.

### Features

- 🔒 **Private by design** — all inference happens locally in the browser.
- 💡 **Actionable answers** — tailored for planning, productivity, learning, and wellness prompts.
- ⚡ **One-click starters** — quick prompt shortcuts to explore the assistant instantly.
- 🌓 **Responsive UI** — polished chat experience with keyboard-friendly input and smooth scrolling.

### Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and start chatting. The first request will download the model weights in the background; subsequent responses are fast thanks to browser caching.

### Production Build

```bash
npm run build
npm run start
```

### Deployment

The project is optimized for Vercel. After building locally, deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-67f1f3c7
```

### Notes

- The model weights are cached in the browser using the Fetch API cache, so the initial load may take ~10–20 MB of network traffic depending on the client.
- All conversations are stored in memory only; refreshing the page resets the chat history.
- To swap models, update the identifier in `src/app/page.tsx` and ensure it is available through `@xenova/transformers`.
