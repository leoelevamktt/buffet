const akelaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110">
  <defs>
    <linearGradient id="wood" x1="0" x2="1"><stop stop-color="#6d3d20"/><stop offset=".5" stop-color="#a56d38"/><stop offset="1" stop-color="#6d3d20"/></linearGradient>
  </defs>
  <path d="M18 33C31 8 149 8 162 33l-12 45c-25 13-95 13-120 0L18 33Z" fill="url(#wood)" stroke="#4a2817" stroke-width="4"/>
  <path d="M31 37c29-18 89-19 119 0" fill="none" stroke="#d6a96d" stroke-width="3" opacity=".7"/>
  <text x="90" y="62" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="700" fill="#fff4d8">Akela</text>
  <text x="91" y="79" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#f6d28f">BUFFET</text>
</svg>`
export const brandMark = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(akelaSvg)
