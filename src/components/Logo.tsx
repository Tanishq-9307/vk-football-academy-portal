/**
 * VK Football Academy crest — faithful flat redraw of the academy's real
 * crest (Instagram @vk_football_academy, verified 22 Nov 2026).
 * Gold-bordered black shield, football sitting on the top edge, silver "V"
 * and red "K" interlocked, and a red ribbon reading "VK FOOTBALL ACADEMY"
 * across the lower third. Metallic gradients from the original are
 * simplified to flat solids so the crest stays crisp at any size.
 * The ribbon text is kept in the SVG; at small header sizes it is tiny
 * by design — the crest still reads as shield + ball + VK.
 */
export default function Logo({
  size = 40,
  withWordmark = false,
}: {
  size?: number
  withWordmark?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="VK Football Academy">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 140"
        role="img"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <clipPath id="vkfa-ball-clip">
            <circle cx="60" cy="22" r="13" />
          </clipPath>
        </defs>

        {/* Shield — thick gold outer border, black field */}
        <path
          d="M18 24 H102 V70 L60 134 L18 70 Z"
          fill="#D4A017"
        />
        <path
          d="M23 29 H97 V69 L60 127 L23 69 Z"
          fill="#0A0A0A"
        />
        {/* Thin gold inner border line */}
        <path
          d="M26.5 32.5 H93.5 V67.5 L60 122.5 L26.5 67.5 Z"
          fill="none"
          stroke="#C9A227"
          strokeWidth="1.2"
        />

        {/* "V" — silver-white, sharp pointed, interlocked with the K */}
        <polygon
          points="26,36 35,36 47,66 53,36 62,36 47,82"
          fill="#C0C0C0"
        />
        {/* "K" — bright scarlet with a thin white outline, sharp arms */}
        <polygon
          points="58,36 68,36 68,52 80,36 92,36 74,56 94,82 82,82 68,60 68,82 58,82"
          fill="#E30613"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="miter"
        />

        {/* Football — half above the shield's top edge, thin gold ring */}
        <g>
          <circle cx="60" cy="22" r="13" fill="#FFFFFF" />
          <g clipPath="url(#vkfa-ball-clip)">
            {/* Central black pentagon */}
            <polygon
              points="60,17.8 63.99,20.7 62.47,25.4 57.53,25.4 56.01,20.7"
              fill="#0A0A0A"
            />
            {/* Seams from the central pentagon out to the rim */}
            <path
              d="M60 17.8 L60 11 M63.99 20.7 L70.46 18.6 M62.47 25.4 L66.46 30.9 M57.53 25.4 L53.54 30.9 M56.01 20.7 L49.54 18.6"
              stroke="#0A0A0A"
              strokeWidth="1"
              fill="none"
            />
            {/* Small black pentagon patches at the rim */}
            <polygon points="60,8.4 62.47,10.19 61.53,13.1 58.47,13.1 57.53,10.19" fill="#0A0A0A" />
            <polygon points="70.46,16 72.93,17.39 71.99,20.3 68.93,20.3 67.99,17.39" fill="#0A0A0A" />
            <polygon points="66.46,28.3 68.93,29.69 67.99,32.6 64.93,32.6 63.99,29.69" fill="#0A0A0A" />
            <polygon points="53.54,28.3 56.01,29.69 55.07,32.6 52.01,32.6 51.07,29.69" fill="#0A0A0A" />
            <polygon points="49.54,16 52.01,17.39 51.07,20.3 48.01,20.3 47.07,17.39" fill="#0A0A0A" />
          </g>
          <circle cx="60" cy="22" r="14.2" fill="none" stroke="#C9A227" strokeWidth="1.6" />
        </g>

        {/* Ribbon tails — folded, pointed, darker red (the fold's back) */}
        <polygon points="12,88 0,84 4,94 0,104 12,102" fill="#A80510" />
        <polygon points="108,88 120,84 116,94 120,104 108,102" fill="#A80510" />
        {/* Ribbon band — bright red, slightly arched */}
        <path
          d="M8 90 Q60 82 112 90 L112 102 Q60 94 8 102 Z"
          fill="#E30613"
        />
        {/* Ribbon lettering — bold white condensed caps, single line */}
        <text
          x="60"
          y="96"
          textAnchor="middle"
          fontFamily="Oswald, 'Arial Narrow', Arial, sans-serif"
          fontWeight="700"
          fontSize="7"
          letterSpacing="0.5"
          textLength="92"
          lengthAdjust="spacingAndGlyphs"
          fill="#FFFFFF"
        >
          VK FOOTBALL ACADEMY
        </text>
      </svg>
      {withWordmark && (
        <span className="leading-none">
          <span className="font-display block text-lg font-semibold tracking-wide text-white">
            VK FOOTBALL ACADEMY
          </span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-[0.18em] text-zinc-400">
            DEVELOP · COMPETE · EXCEL
          </span>
        </span>
      )}
    </span>
  )
}
