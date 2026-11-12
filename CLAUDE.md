# CLAUDE.md — Homami

Homami is a pet-care app for a trusted circle: invite-only sign-up, pets, a wall of posts, pet sitters, and chat. Stack: React 19 + TypeScript + Vite + Tailwind 4, Supabase (auth, data, storage), Storybook 10. Deployed on Vercel, with Storybook served at `/storybook/`.

## Sources of truth
- **Components → Storybook.** `src/components/{basics,blocks,brand}` plus their `*.stories.tsx` define every component's API, variants and states. Build screens only from these. Reuse or extend a component before writing a new one. A new or changed component gets a story (with `parameters.design` pointing at its Figma node) in the same change. Don't style one-offs inline in a screen.
- **Tokens → `src/styles/tokens.css`** (shown in `src/foundations/Foundations.stories.tsx`). Never hard-code colours, spacing or radii.
- **UX → Figma**: https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0. The `design` page has the flows, `Components` has the library, and `Built in code – Oct 18` is the built snapshot. Read the frame through the Figma MCP before building a flow. Component comments cite their Figma node (e.g. `Figma "Button" (105:8598)`), so keep doing that. Sara often changes things directly in code, so **for anything already built, the code wins.** Don't "fix" built screens back to Figma. Use Figma for flows that aren't built yet, and match how the built screens look and behave now.

## How to work
- **Pick the next task yourself.** Compare the Figma `design` page with what's built (screens in `src/screens`, routes in `src/lib/router.ts`, `git log`), then start on the first flow that's designed but not built or unfinished. Don't stop after a plan: implement it.
- **Test in a real browser.** Run `npm run dev` (app) and `npm run storybook` (port 6006). Click through the changed flow in the browser at phone width (375px) and check the console. Check the stories for any component you touched. Run `npm run build` and `npm run lint` before calling something done.
- **Fix bugs automatically.** Fix bugs in the flow you're touching, and regressions you caused, then re-test, without asking. Fix small, clearly safe unrelated bugs too, and list bigger ones in your summary.
- **Database changes** go in a new numbered script `supabase/NN-name.sql`. Follow the existing header (plain-English purpose, "Safe to run again", idempotent SQL). Code must show a clear message if the script hasn't been run yet (see the sitter screens).
- **Product decisions** (rules about who can do what, money, privacy) get a dated entry in `docs/decisions.md`, with the why. If members are affected, also update Find out more (`src/lib/help.ts`, `#/help`) in the same change.
- **Commit messages** are plain-language and user-facing, like the existing history ("Your pets: compact saved view with Edit / Done; …").
- Copy is warm, short and plain. No jargon.

## Approval boundaries: ask first
- `git push` (Vercel deploys from it), opening PRs, or anything that publishes.
- Running SQL against Supabase or changing its settings. Sara runs the scripts herself, so tell her which one.
- Editing the Figma file, changing design tokens, or changing a component's existing API in a way that breaks current uses.
- Installing or removing dependencies, or touching `.env`, keys, or auth settings.
- Deleting files you didn't create.

Everything else (editing code, adding stories and components, running dev servers, local testing, local commits on a branch) can go ahead without asking.
