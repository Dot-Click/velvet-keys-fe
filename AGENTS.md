<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Build the product shell from reusable `src/components` patterns and keep page routes focused on content composition, so navigation and design primitives remain consistent as the platform grows.
- Keep authentication screens provider-agnostic behind `AuthProvider`, with its context singleton stable across hot updates; the local adapter can be replaced without UI changes.
- Keep Concierge operational modules on distinct authenticated routes and compose each from reusable feature components, so later data sources can replace local demo data without restructuring navigation.
