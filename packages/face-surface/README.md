# @webforge/photo3d-face-surface — experimental package (v0.4.1-dev.0)

Pure-ESM, browser/Node-compatible geometry and triangle/UV utilities. This is a **developer build artifact**, not yet a published npm package. The `@webforge` scope is provisional and `private:true` prevents accidental publishing. No external model or WebGL dependency is bundled.

Source of truth: `src/geometry/face-triangles.js` and `src/geometry/face-topology.js` at the repository root. Run `node scripts/build-face-surface-package.mjs` to generate this package's `dist/`; CI also runs the package tests and uploads a `.tgz` artifact. The app does not need npm.

Example after preparing/installing the local archive:

```js
import { createTexturedFaceSurface } from "@webforge/photo3d-face-surface";
const surface = createTexturedFaceSurface(realMediaPipeResult, {
  width: originalImageWidth,
  height: originalImageHeight,
  depthStrength: 1
});
// surface.positions, surface.uvs, surface.indices
```

**Requires actual model topology** from ordered official tessellation edges or validated triangle indices. Never reconstructs hidden geometry or metric depth; never ships model weights. Choose public package name/license and add versioned compatibility tests before external publishing.

## Surface diagnostics

The optional `auditFaceSurface(surface)` function reports **actual boundary edges, connected boundary components, non-manifold edges and unused vertices**. It neither invents missing eye/mouth surfaces nor silently repairs topology. Consumers decide how to display results. The model-specific left-eye/right-eye/lips regions come from MediaPipe official edge lists; this geometry package only validates the supplied region connection data.
