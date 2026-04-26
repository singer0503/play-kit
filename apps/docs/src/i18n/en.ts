// Docs site 專用的字串（不與 library i18n 混用）

export interface DocsStrings {
  brand: string;
  brandSub: string;
  search: string;
  categories: {
    classic: string;
    skill: string;
    loyalty: string;
  };
  tabs: {
    demo: string;
    code: string;
  };
  labels: {
    copy: string;
    copied: string;
    theme: string;
    lang: string;
    reset: string;
    install: string;
    usage: string;
    introduction: string;
    props: string;
    events: string;
    methods: string;
    types: string;
    onThisPage: string;
    playground: string;
    stateMatrix: string;
    menu: string;
    closeMenu: string;
  };
  home: {
    kicker: string;
    title: string;
    lead: string;
    browse: string;
    getStarted: string;
    stats: {
      games: string;
      states: string;
      deps: string;
    };
  };
  resources: {
    title: string;
    examples: string;
    github: string;
  };
  footer: string;
}

export const en: DocsStrings = {
  brand: 'Play Kit',
  brandSub: 'React Mini-Game Kit',
  search: 'Search games…',
  categories: {
    classic: 'Classic Lottery',
    skill: 'Skill-based',
    loyalty: 'Loyalty',
  },
  tabs: {
    demo: 'Preview',
    code: 'Code',
  },
  labels: {
    copy: 'Copy',
    copied: 'Copied',
    theme: 'Theme',
    lang: 'Language',
    reset: 'Reset state',
    install: 'Install',
    usage: 'Basic Usage',
    introduction: 'Introduction',
    props: 'Props',
    events: 'Events',
    methods: 'Methods',
    types: 'Types',
    onThisPage: 'On this page',
    playground: 'Interactive Playground',
    stateMatrix: 'State Matrix',
    menu: 'Open menu',
    closeMenu: 'Close menu',
  },
  home: {
    kicker: 'React Mini-Game Kit',
    title: 'Drop-in game mechanics for modern web products',
    lead: '17 polished React mini-games. Full state machines, controlled props, ref API, a11y out of the box. Zero runtime deps.',
    browse: 'Browse games',
    getStarted: 'Get started',
    stats: {
      games: 'games',
      states: 'states',
      deps: 'deps',
    },
  },
  resources: {
    title: 'Resources',
    examples: 'Examples',
    github: 'GitHub',
  },
  footer: 'Original designs. No third-party brand assets.',
};
