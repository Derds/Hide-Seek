# Development Setup

Everything you need to build and run this SvelteKit project.

## Install dependencies

```sh
npm install
```

## Developing

Start a development server:

```sh
npm run dev

# or open in a new browser tab automatically
npm run dev -- --open
```

## Testing

```sh
npm test          # run once
npm run test:watch  # watch mode
```

## Building

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Recreating the project scaffold

```sh
npx sv@0.15.1 create --template minimal --types ts --install npm .
```
