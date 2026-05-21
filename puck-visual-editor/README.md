# Puck Visual Editor

A small React + Vite app built around the open-source Puck editor. It gives you a drag-and-drop canvas, a left component drawer, a right properties panel, and localStorage persistence for the full page JSON.

## What it includes

- Custom editor blocks: hero, service card, stat block, testimonial
- Editable fields exposed through the Puck sidebar
- Read-only render preview beside the editor
- Autosave to browser localStorage
- Dark, responsive UI designed to stay beginner-friendly

## Run it

```bash
npm install
npm run dev
```

## Save format

The editor stores its page JSON under the key `puck-visual-editor-data`.

## Notes

The project uses the open-source Puck package `@measured/puck`. If you want to swap package names later, update `package.json` and the import in `src/App.jsx` together.
