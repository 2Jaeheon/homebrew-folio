// Puts the real metal-fx ring (WebGL "liquid metal") around the landing page copy buttons.
// The page has no React, so each button gets its own tiny React root. The original <button> node is moved
// into the MetalFx host, so its copy handler from main.js keeps working. Without WebGL2 the CSS ring stays.
// Settings come from the libraries.dev Studio "Copy prompt" the owner tuned.
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { setGlowConfig, setBendConfig, MetalFx, isMetalFxSupported } from 'metal-fx';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

setGlowConfig({ haloOpMul: 1.84 }); // halo
setBendConfig({ strength: 0, reach: 0, maxDisp: 0 }); // no cursor bend

function Ring({ button }) {
  const host = useRef(null);
  useEffect(() => { host.current.append(button); }, [button]);
  return (
    <MetalFx preset="chromatic" variant="circle" theme="dark" strength={0.81} shaderScale={1.35} innerShadow paused={still}>
      <span className="metal-host" ref={host} />
    </MetalFx>
  );
}

if (isMetalFxSupported()) {
  document.querySelectorAll('.copy.metal').forEach((button) => {
    const slot = document.createElement('span');
    slot.className = 'metal-slot';
    button.replaceWith(slot);
    button.classList.add('fx'); // turns off the CSS fallback ring
    createRoot(slot).render(<Ring button={button} />);
  });
}
