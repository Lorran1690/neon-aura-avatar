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

- Keep the holographic studio on a client-only index route using React Three Fiber; WebGL must never render on the server.
- Strip DOM-only data-* metadata through scene wrappers before forwarding props to R3F intrinsics and drei helpers; editor source tagging otherwise becomes invalid Three.js pierced properties.
- Use the external-store avatar controller for both UI and browser commands; one validated command interface keeps animation state synchronized.
- Animate the CC0 rigged humanoid through its skeleton and extend its PBR material with holographic shaders; sourced anatomy and GPU skinning keep gestures natural.
- Store all scene and UI colors as semantic CSS tokens; resolve CSS color values before passing them to Three.js.
- Expose local integration through window.aura, aura:command and aura:state; postMessage accepts only same-origin senders to prevent unsolicited cross-origin commands.
