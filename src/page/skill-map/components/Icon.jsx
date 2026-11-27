const shapes = {
  brand: <> <path d="m12 3 9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5"></path> </>,
  map: <> <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z M9 3v15m6-12v15"></path> </>,
  tasks: <> <rect height="16" rx="2" width="16" x="4" y="4"></rect><path d="m8 12 3 3 5-6"></path> </>,
  history: <> <path d="M4 20h16M6 17v-5h3v5m3 0V8h3v9m3 0V4h3v13"></path> </>,
  badge: <> <circle cx="12" cy="9" r="6"></circle><path d="m8 14-2 7 6-3 6 3-2-7"></path> </>,
  user: <> <circle cx="12" cy="8" r="4"></circle><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"></path> </>,
  flag: <> <path d="M5 21V3m0 2c5-4 8 4 14 0v10c-6 4-9-4-14 0"></path> </>,
  lock: <> <rect height="11" rx="2" width="14" x="5" y="10"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path> </>,
  html: <> <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"></path> </>,
  css: <> <path d="M4 3h16l-2 16-6 3-6-3L4 3Z M7 8h10l-1 4H8l1 4 3 1 3-1"></path> </>,
  javascript: <> <rect height="18" rx="3" width="18" x="3" y="3"></rect><path d="M10 8v7c0 2-2 2-3 1m7-1c1 2 4 2 4 0s-4-2-4-4 3-2 4-1"></path> </>,
  react: <> <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"></ellipse><circle cx="12" cy="12" fill="currentColor" r="1" stroke="none"></circle> </>,
  git: <> <circle cx="6" cy="5" r="2"></circle><circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="7" r="2"></circle><path d="M6 7v10m0-4c8 0 12-1 12-4"></path> </>,
};
export default function Icon({name, className="ui-icon"}) { return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>; }
