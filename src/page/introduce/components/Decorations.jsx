// 裝飾用的 SVG（純裝飾，對輔助科技隱藏）。顏色用共用 CSS 變數，深淺色都正確。

// 品牌標誌：三層疊起來的菱形（技能一層一層往上疊）
export function BrandLogo({ size = 32 }) {
  return (
    <svg
      className="brand-logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 4 28 10.5 16 17 4 10.5Z" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M4 16 16 22.5 28 16" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21.5 16 28 28 21.5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 山丘＋旗子：用在 Banner 右上角與「敬請期待」區塊
export function MountainFlag({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 -24 320 144"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 120 C60 80 110 90 150 70 C190 50 210 20 240 18 C270 16 300 60 320 70 L320 120Z" fill="var(--color-primary)" opacity="0.14" />
      <path d="M90 120 C140 95 180 80 215 50 C235 33 250 28 265 40 C285 58 300 90 320 100 L320 120Z" fill="var(--color-primary)" opacity="0.22" />
      <line x1="240" y1="18" x2="240" y2="-14" stroke="var(--color-text-muted)" strokeWidth="2" />
      <path d="M241 -14 L262 -7 L241 0Z" fill="var(--color-primary)" />
    </svg>
  );
}
