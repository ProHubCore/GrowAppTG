const base = (content: string, className = 'icon') =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${content}</svg>`

export const icons = {
  today: base('<path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m9 14 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  map: base('<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="1.8"/>'),
  progress: base('<path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  profile: base('<circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  plus: base('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  bolt: base('<path d="M13.3 2 5.8 13h5.4L10.7 22l7.5-11h-5.4L13.3 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  play: base('<path d="m9 7 8 5-8 5V7Z" fill="currentColor"/>'),
  pause: base('<path d="M8 6h3v12H8zM13 6h3v12h-3z" fill="currentColor"/>'),
  check: base('<path d="m5 12 4.2 4.2L19 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  clock: base('<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
  arrow: base('<path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'),
  more: base('<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>'),
  spark: base('<path d="m12 2 1.5 5.2L19 9l-5.5 1.8L12 16l-1.5-5.2L5 9l5.5-1.8L12 2ZM18.5 15l.7 2.3 2.3.7-2.3.8-.7 2.2-.8-2.2-2.2-.8 2.2-.7.8-2.3Z" fill="currentColor"/>'),
  flag: base('<path d="M6 21V4m0 1h10l-2 3 2 3H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  target: base('<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
  flame: base('<path d="M13.5 3.5c.3 3-1.7 4.2-2.6 6.1-.8-1-.9-2.1-.7-3.4-2.6 2.1-4.2 4.5-4.2 7.2A6 6 0 0 0 18 14c0-4.2-2.3-7.6-4.5-10.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12.2 12c-1.6 1.2-2.2 2.3-2.2 3.5a2.3 2.3 0 1 0 4.6 0c0-1.3-.8-2.5-2.4-3.5Z" fill="currentColor"/>'),
  brain: base('<path d="M9 4.5A3 3 0 0 0 5.8 8a3.2 3.2 0 0 0-.2 6 3 3 0 0 0 3.4 4.5M15 4.5A3 3 0 0 1 18.2 8a3.2 3.2 0 0 1 .2 6 3 3 0 0 1-3.4 4.5M12 4v16M9 9.2c1.8.2 3-1 3-2.5M15 9.2c-1.8.2-3-1-3-2.5M9 14.8c1.8-.2 3 1 3 2.5M15 14.8c-1.8-.2-3 1-3 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  close: base('<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  edit: base('<path d="m14.5 5.5 4 4M5 19l3.2-.6L19 7.6 16.4 5 5.6 15.8 5 19Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'),
  trash: base('<path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M6.5 7l.7 13h9.6l.7-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'),
  chevronDown: base('<path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  trophy: base('<path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM9 18h6M12 12v6M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'),
  leaf: base('<path d="M19.5 4.5C12 4.5 6 8 6 14.2c0 2.8 2 5.3 5 5.3 6.2 0 8.5-7 8.5-15Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M5 20c2.2-4.5 5.6-8.3 10.5-11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
}
