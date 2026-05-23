# Agent Instructions

## Project Stack
- React 19 + TypeScript + Vite (React Compiler enabled)
- react-router-dom v7 for routing
- Tailwind CSS v4 with `@tailwindcss/postcss` (no Tailwind config file needed)
- Firebase (auth + Firestore) for backend
- Custom CSS variables (used alongside Tailwind)

## Key Commands
- `bun run dev` - Start dev server
- `bun run build` - Typecheck + build for production
- `bun run lint` - ESLint
- `bun run preview` - Preview production build

## Current Structure
```
src/
├── pages/          # Route components: Landing, Login, Register, CompleteProfile, Dashboard, Profile, Room
├── components/     # ProtectedRoute (placeholder, needs AuthContext)
├── App.tsx         # Routes definition
├── main.tsx        # Entry point
└── index.css       # Tailwind directives + custom CSS variables
```

## Routes
- Public: `/`, `/login`, `/register`
- Protected: `/dashboard`, `/profile`, `/room/:id`, `/complete-profile`

## Pending Setup
- AuthContext and Firebase services need to be implemented
- ProtectedRoute currently has no auth logic
- All page components are empty placeholders

## Notes
- Vite config uses Babel plugin with React Compiler (babel-plugin-react-compiler)
- No `.env` file exists yet - Firebase credentials needed for actual auth
- Platform: Windows (PowerShell), use `Remove-Item` instead of `rm` for file ops

## CI / Verification
- ALWAYS run `bun run lint` and `bun run build` before finishing any task
- Fix all ESLint errors and TypeScript errors before completing
- Never leave lint errors or type errors unfixed
- Run `bun run build` to verify the production build succeeds
