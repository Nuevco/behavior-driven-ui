# React Sample

This sample React application demonstrates a minimal Vite + React setup that
builds successfully on Node.js 20.9 and newer. It intentionally stays on Vite 5
so that asset hashing relies on the classic `createHash` helper provided by all
supported Node 20 releases.

## Available scripts

- `pnpm --filter react-sample dev` – start the Vite dev server.
- `pnpm --filter react-sample build` – type-check and create a production build.
- `pnpm --filter react-sample preview` – preview the production build locally.
- `pnpm --filter react-sample lint` – run ESLint on the source directory.
- `pnpm --filter react-sample type:check` – run TypeScript without emitting files.
- `pnpm --filter react-sample test` – execute the BDUI CLI against the sample features.

## Node.js compatibility

Vite 5 supports Node.js 18 and 20 without requiring the newer
`crypto.hash` helper that ships in Node 20.19+. If you plan to upgrade Vite,
update your Node.js runtime to 20.19+ or 22.12+ first to avoid build failures.
