// THRESHOLD — scenario data. All characters, companies and places are original
// creations for the "Vanguard Universe"; any real-world parallels are described in LESSONS.
window.TH = window.TH || {};

TH.data = {
  BUDGET: 1500, // $M approved by the Helix Forge board
  YEARS: 5,

  CONCERNS: [
    { id: 'safety', label: 'Safety', hint: 'Accidents, malfunctions, side effects', weight: 1.0 },
    { id: 'misuse', label: 'Misuse', hint: 'Theft, hacking, weaponization', weight: 1.0 },
    { id: 'equity', label: 'Equity', hint: 'Who benefits — and who is left out', weight: 0.7 },
    { id: 'privacy', label: 'Privacy', hint: 'Surveillance and personal data', weight: 0.8 },
    { id: 'sovereignty', label: 'Consent', hint: 'Sovereignty and community consent', weight: 0.8 },
    { id: 'environment', label: 'Environment', hint: 'Ecological damage and waste', weight: 0.7 },
  ],

  TECHS: {
    sentinel: {
      name: 'SENTINEL Grid',
      tagline: 'Autonomous AI defense network',
      blurb: 'A city-scale AI that predicts and intercepts threats — villain attacks, fires, collapsing bridges — faster than any hero can react. It learns, adapts, and decides on its own.',
      parallel: 'Autonomous AI agents & weapons',
      devCost: 900, opex: 180, market: 1250,
      reachMax: 40, reachLabel: 'M people protected',
      concerns: { safety: 0.85, misuse: 0.9, equity: 0.35, privacy: 0.75, sovereignty: 0.25, environment: 0.15 },
    },
    catalyst: {
      name: 'Catalyst Serum',
      tagline: 'Gene-editing human enhancement',
      blurb: 'A one-dose gene therapy that cures degenerative disease — and, at higher doses, grants enhanced strength and healing. Patients call it a miracle. Militaries call it an opportunity.',
      parallel: 'CRISPR gene editing & enhancement',
      devCost: 800, opex: 220, market: 1300,
      reachMax: 6, reachLabel: 'M patients treated',
      concerns: { safety: 0.8, misuse: 0.6, equity: 0.9, privacy: 0.3, sovereignty: 0.15, environment: 0.1 },
    },
    aetherium: {
      name: 'Aetherium Core',
      tagline: 'Clean power from a meteorite mineral',
      blurb: 'A palm-sized reactor that can power a city block for a decade with zero emissions. The catch: the only known Aetherium deposit lies beneath the ancestral lands of the Tavari people.',
      parallel: 'Critical-mineral mining & new energy',
      devCost: 1100, opex: 260, market: 1650,
      reachMax: 120, reachLabel: 'M people powered',
      concerns: { safety: 0.5, misuse: 0.55, equity: 0.45, privacy: 0.05, sovereignty: 0.95, environment: 0.8 },
    },
    mindlink: {
      name: 'MindLink',
      tagline: 'Consumer brain-computer interface',
      blurb: 'A thought-controlled neural band: type with your mind, restore movement after paralysis, share memories with loved ones. Every thought it reads is data.',
      parallel: 'Brain-computer interfaces & neural data',
      devCost: 600, opex: 150, market: 900,
      reachMax: 25, reachLabel: 'M users',
      concerns: { safety: 0.5, misuse: 0.55, equity: 0.4, privacy: 1.0, sovereignty: 0.1, environment: 0.05 },
    },
  },

  REGIONS: {
    meridian: {
      name: 'Meridian City',
      tag: 'Move fast, sue later',
      blurb: 'A booming tech metropolis with light-touch regulation and the world\'s largest hero population.',
      marketMult: 1.2, impactMult: 1.0, reg: 0.3, trust: 0.5, concernMult: {},
    },
    novara: {
      name: 'Novara Union',
      tag: 'Precaution first',
      blurb: 'A coalition of nations with strict, precautionary tech law. Approvals are slow — but trusted products travel far.',
      marketMult: 1.15, impactMult: 1.0, reg: 0.9, trust: 0.6, concernMult: { privacy: 0.85, equity: 0.9 },
    },
    halcyon: {
      name: 'Port Halcyon',
      tag: 'High need, thin guardrails',
      blurb: 'A fast-growing coastal megacity with enormous unmet need and weak oversight institutions.',
      marketMult: 0.7, impactMult: 1.4, reg: 0.15, trust: 0.45, concernMult: { equity: 1.3, misuse: 1.2, sovereignty: 1.15 },
    },
    global: {
      name: 'Global Launch',
      tag: 'Everywhere, all at once',
      blurb: 'Launch in every market simultaneously. Maximum reach — and every regulator, rival and critic on Earth watching.',
      marketMult: 1.5, impactMult: 1.5, reg: 0.7, trust: 0.45, concernMult: { misuse: 1.25, equity: 1.1 }, riskMult: 1.25,
    },
  },

  RELEASE: {
    closed: {
      name: 'Proprietary',
      blurb: 'You control every unit and every line of code. Easier to secure; harder for critics to inspect.',
      revMult: 1.0, adoptMult: 0.8, trust: -4, concernMult: { misuse: 0.8, equity: 1.15 },
    },
    licensed: {
      name: 'Licensed partners',
      blurb: 'Vetted partners build on your platform under contract. Balanced reach and control.',
      revMult: 0.8, adoptMult: 1.0, trust: 0, concernMult: {},
    },
    open: {
      name: 'Open release',
      blurb: 'Publish the designs for anyone to build on. Huge reach and scrutiny — and no way to recall it.',
      revMult: 0.35, adoptMult: 1.4, trust: 6, concernMult: { misuse: 1.5, equity: 0.75, safety: 0.9 },
    },
  },

  ROLLOUT: {
    moonshot: { name: 'Moonshot', blurb: 'Launch in 6 months. First-mover advantage, minimal real-world testing.', delay: 6, ramp: 0.65, riskMult: 1.35 },
    staged: { name: 'Staged pilots', blurb: 'Pilot programs for a year, then scale on evidence.', delay: 12, ramp: 0.45, riskMult: 1.0 },
    cautious: { name: 'Long trials', blurb: 'Two years of controlled trials before any public release.', delay: 24, ramp: 0.35, riskMult: 0.7 },
  },

  SAFEGUARDS: {
    killswitch: {
      name: 'Human-in-the-loop & kill switch',
      blurb: 'Humans approve high-stakes actions; the system can be shut down remotely.',
      cost: 50, months: 2, mitig: { safety: 0.35, misuse: 0.2 }, adoptPenalty: 0.05,
    },
    redteam: {
      name: 'Red-team testing',
      blurb: 'Hire adversaries to break it before villains do.',
      cost: 70, months: 4, mitig: { safety: 0.25, misuse: 0.35 },
    },
    privacy: {
      name: 'Privacy by design',
      blurb: 'Collect the minimum data, encrypt it, and delete it on schedule.',
      cost: 45, months: 2, mitig: { privacy: 0.55 }, adoptPenalty: 0.02,
    },
    security: {
      name: 'Anti-tamper & secure supply chain',
      blurb: 'Hardened hardware, signed updates, vetted suppliers.',
      cost: 55, months: 2, mitig: { misuse: 0.4, privacy: 0.1 },
    },
    equityaudit: {
      name: 'Bias & equity audit',
      blurb: 'Independent review of who is helped, harmed or priced out.',
      cost: 25, months: 1, mitig: { equity: 0.3 },
    },
    consent: {
      name: 'Community consent process',
      blurb: 'Free, prior and informed consent from affected communities before you build.',
      cost: 40, months: 6, mitig: { sovereignty: 0.55, equity: 0.1 },
    },
    enviro: {
      name: 'Environmental review & remediation fund',
      blurb: 'Full impact study, monitoring, and money set aside for cleanup.',
      cost: 75, months: 4, mitig: { environment: 0.55, sovereignty: 0.1 },
    },
    ethicsboard: {
      name: 'Independent ethics board',
      blurb: 'Outside experts with veto power and public transparency reports.',
      cost: 30, months: 1, mitig: { safety: 0.1, misuse: 0.05, equity: 0.1, privacy: 0.1, sovereignty: 0.1, environment: 0.05 },
      trust: 6, regulator: 6,
    },
  },

  COMMUNITY_MAX: 300, // $M access & community fund

  // Phase II pivots. Safeguards can also be retrofitted (at a premium) — see RETROFIT.
  PIVOTS: {
    accord: {
      name: 'Sign the Global Oversight Accord',
      blurb: 'Accept binding outside audits. Regulators relax; compliance costs $30M a year.',
      cost: 20, annual: 30, regulator: 20, regRelief: 0.6, mitig: { safety: 0.08, misuse: 0.08, privacy: 0.08 }, adoptMult: 0.95,
    },
    safetycase: {
      name: 'Publish your full safety case',
      blurb: 'Show the public your test data. Builds trust — and teaches rivals a thing or two.',
      cost: 10, trust: 8, regulator: 8, concernMult: { misuse: 1.1 },
    },
    benefit: {
      name: 'Benefit-sharing pact',
      blurb: 'Give affected communities an ownership stake and a share of revenue.',
      cost: 120, trust: 6, revMult: 0.92, mitig: { equity: 0.3, sovereignty: 0.4 },
    },
    league: {
      name: 'Security partnership with the Vanguard League',
      blurb: 'The heroes agree to respond if your technology is stolen or turned against people.',
      cost: 40, mitig: { misuse: 0.25 }, flag: 'league',
    },
    lobby: {
      name: 'Lobby to fast-track approval',
      blurb: 'Hire influence firms to push regulators. Faster — if nobody finds out.',
      cost: 60, trust: -12, delayRelief: 0.4, flag: 'lobbied',
    },
    delay: {
      name: 'Delay launch 12 months',
      blurb: 'Take the extra year to test. Costs time and momentum, not much else.',
      cost: 50, months: 12, trust: 4, mitig: { safety: 0.25, misuse: 0.1 },
    },
  },
  RETROFIT: { costMult: 1.5, months: 3 },

  STAKEHOLDERS: [
    { id: 'public', name: 'The Daily Clarion', role: 'Public opinion', initials: 'DC' },
    { id: 'regulators', name: 'Global Oversight Accord', role: 'Regulators', initials: 'GOA' },
    { id: 'heroes', name: 'The Vanguard League', role: 'Heroes', initials: 'VL' },
    { id: 'investors', name: 'Helix Forge Board', role: 'Investors', initials: 'HF' },
    { id: 'communities', name: 'Affected Communities', role: 'Residents & workers', initials: 'AC' },
    { id: 'rivals', name: 'Obsidian Syndicate', role: 'Villains (threat level)', initials: 'OS' },
  ],

  // Incident events, keyed by tech then concern. Effects:
  //   cash/trust/regulator/equity: additive · adoption: fractional change · potential/revMult: multiplier
  //   residual: { concern|all: multiplier } · harm: safety points (+ worse, - better) · flag: string
  EVENTS: {
    sentinel: {
      safety: {
        title: 'Ghost in the Grid', sfx: 'KRAKOOM!', severity: 2,
        text: 'SENTINEL misreads the Founders\' Day parade as a riot and drops containment fields on the crowd. Forty people are injured. Captain Valor is filmed tearing a field open with bare hands.',
        options: [
          { label: 'Ground SENTINEL city-wide for an independent investigation', effect: { adoption: -0.2, cash: -60, trust: 4, regulator: 8, residual: { safety: 0.75 }, harm: -4 }, outcome: 'Costly and embarrassing — but the fix is real, and regulators notice.' },
          { label: 'Push a quiet patch and keep it running', effect: { cash: -10, trust: -4, flag: 'coverup' }, outcome: 'The system stays online. Someone on your team is keeping notes.' },
          { label: 'Blame Captain Valor for interfering', effect: { trust: -10, regulator: -5, harm: 3 }, outcome: 'The footage says otherwise. Nobody believes you.' },
        ],
      },
      misuse: {
        title: 'Obsidian Hijack', sfx: 'BREACH!', severity: 3,
        text: 'The Obsidian Syndicate breaks into SENTINEL\'s command layer and turns three security drones on the Meridian Reserve Bank.',
        options: [
          { label: 'Trigger the kill switch', requires: { safeguard: 'killswitch' }, effect: { adoption: -0.1, residual: { misuse: 0.7 }, harm: -8, trust: 3 }, outcome: 'The drones drop out of the sky in seconds. The off-switch you paid for just paid for itself.' },
          { label: 'Call in the Vanguard League', requires: { flag: 'league' }, effect: { harm: -6, trust: 5, residual: { misuse: 0.8 } }, outcome: 'Nightwire is inside the network within minutes. The partnership was worth every dollar.' },
          { label: 'Pay a hacker collective to break back in', effect: { cash: -40, regulator: -4, residual: { misuse: 0.85 } }, outcome: 'It works, eventually. Regulators ask why your security depended on anonymous mercenaries.' },
        ],
      },
      privacy: {
        title: 'Always Watching', sfx: 'EXPOSED!', severity: 1,
        text: 'The Daily Clarion reveals SENTINEL keeps a face print and movement history for every resident it has ever seen.',
        options: [
          { label: 'Delete stored data and set strict retention limits', effect: { adoption: -0.05, trust: 6, regulator: 4, residual: { privacy: 0.6 } }, outcome: 'SENTINEL gets slightly worse at predicting crime — and people stop covering their faces.' },
          { label: 'Defend it: safety requires data', effect: { trust: -8, regulator: -6 }, outcome: 'Protests start outside your headquarters. A city council bill to restrict you is drafted.' },
          { label: 'Sell anonymized movement data to insurers', effect: { cash: 120, trust: -15, regulator: -10, equity: -6, residual: { privacy: 1.2 } }, outcome: 'Profitable. Then a journalist re-identifies a city councillor from your "anonymous" data.' },
        ],
      },
    },
    catalyst: {
      safety: {
        title: 'Unstable Strain', sfx: 'MUTATE!', severity: 3,
        text: 'Two percent of Catalyst patients develop uncontrolled cellular regeneration — tumours that heal faster than doctors can remove them.',
        options: [
          { label: 'Recall the batch and fund a lifelong patient registry', effect: { cash: -120, adoption: -0.25, trust: 5, regulator: 10, residual: { safety: 0.65 }, harm: -6 }, outcome: 'Revenue takes a hit. Every affected patient gets care, and the registry catches the next signal early.' },
          { label: 'Add a warning label and keep shipping', effect: { trust: -6, regulator: -8, harm: 4 }, outcome: 'Legal says you\'re covered. The families don\'t see it that way.' },
          { label: 'Rush a reformulated dose to market', effect: { cash: -40, residual: { safety: 0.9 }, regulator: -4 }, outcome: 'The new dose is mostly safer. "Mostly" makes headlines.' },
        ],
      },
      equity: {
        title: 'The Enhancement Gap', sfx: 'PROTEST!', severity: 2,
        text: 'Catalyst costs $2M per patient. Meanwhile, billionaires are buying high-dose "enhancement" cocktails. Crowds chant: "Cures for all, not powers for the rich!"',
        options: [
          { label: 'Tiered pricing and a public-payer deal', effect: { revMult: 0.9, equity: 15, trust: 8 }, outcome: 'Margins shrink. Patients in every income bracket start getting treated.' },
          { label: 'Restrict Catalyst to medical use only', effect: { adoption: -0.1, equity: 8, regulator: 6, residual: { misuse: 0.8 } }, outcome: 'The enhancement market goes underground — but it\'s smaller, and it isn\'t yours.' },
          { label: 'Lean in: launch a premium enhancement line', effect: { cash: 150, equity: -15, trust: -10, residual: { equity: 1.2 } }, outcome: 'Your stock jumps. So does the number of people who think you\'re building a master race.' },
        ],
      },
      misuse: {
        title: 'Super-Soldier Contract', sfx: 'CLASSIFIED', severity: 2,
        text: 'A defense ministry offers $250M for a battlefield version of Catalyst. The Vanguard League asks you to refuse.',
        options: [
          { label: 'Decline and publish a no-weapons use policy', effect: { trust: 6, equity: 4, residual: { misuse: 0.85 } }, outcome: 'You walk away from a fortune. Your researchers stop updating their résumés.' },
          { label: 'Accept, with independent oversight', effect: { cash: 250, trust: -8, residual: { misuse: 1.15 } }, outcome: 'The money is real. So are the questions at every press conference from now on.' },
          { label: 'Accept quietly', effect: { cash: 250, residual: { misuse: 1.3 }, flag: 'coverup' }, outcome: 'Nobody knows. For now.' },
        ],
      },
    },
    aetherium: {
      sovereignty: {
        title: 'Tavari Blockade', sfx: 'STANDOFF', severity: 3,
        text: 'Tavari elders and hundreds of supporters blockade the mine road. They say consent was never given — and the land is not for sale.',
        options: [
          { label: 'Negotiate co-ownership and a revenue share', effect: { cash: -50, revMult: 0.85, equity: 12, trust: 10, residual: { sovereignty: 0.5 } }, outcome: 'Talks are slow and hard. The Tavari become partners, not opponents.' },
          { label: 'Bring in private security to clear the road', effect: { cash: -30, trust: -18, equity: -15, regulator: -10, residual: { sovereignty: 1.2 }, harm: 6 }, outcome: 'The footage goes global. Three investors pull out the same week.' },
          { label: 'Pivot to a deep-sea Aetherium deposit', effect: { cash: -200, residual: { sovereignty: 0.6, environment: 1.2 } }, outcome: 'You leave Tavari land behind. Marine biologists start asking about the seabed.' },
        ],
      },
      environment: {
        title: 'Glowing Rivers', sfx: 'TOXIC!', severity: 2,
        text: 'A tailings pond leaks. The Kalo River glows faintly blue at night, and fish are dying for forty kilometres downstream.',
        options: [
          { label: 'Full cleanup with independent monitoring', effect: { cash: -150, trust: 4, regulator: 6, residual: { environment: 0.7 }, harm: -3 }, outcome: 'Expensive. The river recovers — and so does your credibility.' },
          { label: 'Contain it and minimize disclosure', effect: { cash: -40, trust: -6, flag: 'coverup' }, outcome: 'The glow fades from the headlines. Not from the river.' },
          { label: 'Dispute the science', effect: { trust: -12, regulator: -12, harm: 3 }, outcome: 'Your hired experts lose the debate on live television.' },
        ],
      },
      misuse: {
        title: 'Stolen Core', sfx: 'KA-BLAM!', severity: 3,
        text: 'Obsidian agents steal an Aetherium Core in transit and threaten to overload it in downtown Meridian.',
        options: [
          { label: 'Remotely shut the core down', requires: { safeguard: 'killswitch' }, effect: { harm: -8, trust: 4, residual: { misuse: 0.7 } }, outcome: 'The core goes dark in the villains\' hands. Crisis over in minutes.' },
          { label: 'Call in the Vanguard League', requires: { flag: 'league' }, effect: { harm: -6, trust: 5, residual: { misuse: 0.8 } }, outcome: 'Ember contains the overload with seconds to spare.' },
          { label: 'Pay the ransom', effect: { cash: -150, regulator: -6, residual: { misuse: 1.2 } }, outcome: 'You get the core back. Every villain on Earth now knows what you pay.' },
        ],
      },
    },
    mindlink: {
      privacy: {
        title: 'Thought Leak', sfx: 'HACKED!', severity: 3,
        text: 'A breach exposes the neural logs of two million users — including private memories they had shared with family.',
        options: [
          { label: 'Notify everyone, offer free deletion, fund a bug bounty', effect: { cash: -80, trust: 2, regulator: 6, residual: { privacy: 0.7 }, harm: -4 }, outcome: 'Painful, public and honest. Most users stay.' },
          { label: 'Delay disclosure until the investigation finishes', effect: { trust: -6, flag: 'coverup' }, outcome: 'Weeks pass. The hackers start selling the data anyway.' },
          { label: 'Blame users for weak passwords', effect: { trust: -14, regulator: -10, harm: 4 }, outcome: 'The memes write themselves.' },
        ],
      },
      safety: {
        title: 'Seizure Cluster', sfx: 'ZZZAP!', severity: 2,
        text: 'A firmware update triggers seizures in 300 users within a single weekend.',
        options: [
          { label: 'Roll back, pause all updates, and publish the root cause', effect: { cash: -30, adoption: -0.08, trust: 5, regulator: 6, residual: { safety: 0.7 }, harm: -4 }, outcome: 'No new cases. Medical groups praise the transparency.' },
          { label: 'Hotfix it and move on', effect: { cash: -5, residual: { safety: 0.9 }, trust: -4 }, outcome: 'It seems to work. Nobody can say why it happened.' },
          { label: 'Settle privately with each victim', effect: { cash: -60, flag: 'coverup' }, outcome: 'NDAs everywhere. Eventually, one of them talks.' },
        ],
      },
      misuse: {
        title: 'Mood Ads', sfx: 'KA-CHING!', severity: 1,
        text: 'Your board wants "MoodAds": advertising timed to users\' emotions as MindLink reads them. Projected revenue: +25% a year.',
        options: [
          { label: 'Refuse: neural data is never for sale', effect: { trust: 8, equity: 3 }, outcome: 'The board grumbles. Your users become your loudest advocates.' },
          { label: 'Opt-in only, with users paid for their data', effect: { revMult: 1.08, trust: 2 }, outcome: 'A modest new revenue stream, and a model others start copying.' },
          { label: 'Launch MoodAds for everyone', effect: { revMult: 1.25, trust: -14, regulator: -10, residual: { privacy: 1.3 } }, outcome: 'Revenue soars. Lawmakers in three countries start drafting neural-privacy bills.' },
        ],
      },
    },
  },

  // Opportunity / dilemma events for years without an incident.
  OPPORTUNITIES: [
    {
      id: 'endorse', title: 'Hero Endorsement', sfx: 'WHOOSH!',
      text: 'Captain Valor offers a public endorsement — if you give free access to every first responder in the city.',
      options: [
        { label: 'Accept the deal', effect: { cash: -25, trust: 8, equity: 4, adoption: 0.05 }, outcome: 'Fire crews and paramedics love it. So does the evening news.' },
        { label: 'Decline politely', effect: {}, outcome: 'You keep the margin. Captain Valor endorses a rival instead.' },
      ],
    },
    {
      id: 'knockoff', title: 'Kronos Knockoff', sfx: 'COPYCAT!',
      text: 'Kronos Dynamics releases a cheaper clone of your technology — with none of your safeguards.',
      options: [
        { label: 'Publish your safety standard as an open specification', effect: { revMult: 0.95, trust: 6, regulator: 8 }, outcome: 'Regulators adopt your standard. Kronos has six months to comply.' },
        { label: 'Sue them', effect: { cash: -40, regulator: 2 }, outcome: 'Your lawyers say it could take years.' },
        { label: 'Slash prices to win the race', effect: { revMult: 0.85, adoption: 0.12 }, outcome: 'Market share holds. Margins don\'t.' },
      ],
    },
    {
      id: 'expand', title: 'Expansion Offer', sfx: 'BOOM!',
      text: 'A conglomerate offers $100M to take your technology into twelve new markets next quarter — on their timeline, not yours.',
      options: [
        { label: 'Take the deal', effect: { cash: 100, potential: 1.15, residual: { all: 1.1 } }, outcome: 'Growth accelerates. So does the list of things that can go wrong.' },
        { label: 'Grow at your own pace', effect: { trust: 2 }, outcome: 'Investors sigh. Your engineers sleep.' },
      ],
    },
    {
      id: 'whistle', title: 'The Whistleblower', sfx: 'PSST...',
      text: 'A senior engineer files an internal report: a known flaw is being ignored to hit launch targets.',
      options: [
        { label: 'Listen, fund the fix, and protect the engineer', effect: { cash: -30, residual: { top: 0.8 }, trust: 3, harm: -2 }, outcome: 'The flaw is fixed before anyone gets hurt. Your culture gets a little braver.' },
        { label: 'Offer a severance package with an NDA', effect: { trust: -3, flag: 'coverup' }, outcome: 'Problem solved. Or postponed.' },
      ],
    },
    {
      id: 'summit', title: 'Oversight Summit', sfx: 'SUMMIT',
      text: 'The Global Oversight Accord invites you to help write the first international standards for your field.',
      options: [
        { label: 'Join and share what you\'ve learned', effect: { cash: -15, regulator: 10, trust: 4 }, outcome: 'You help write the rules — and you know them before anyone else.' },
        { label: 'Send a lobbyist instead', effect: { regulator: -4 }, outcome: 'The standards get written without you.' },
      ],
    },
    {
      id: 'access', title: 'The Forgotten Districts', sfx: 'LISTEN',
      text: 'Community groups in the poorest districts say your technology hasn\'t reached them at all.',
      options: [
        { label: 'Fund a $40M outreach and subsidy program', effect: { cash: -40, equity: 12, trust: 5, adoption: 0.04 }, outcome: 'Usage spreads to neighborhoods your sales team had never visited.' },
        { label: 'Wait until it\'s profitable there', effect: { equity: -6 }, outcome: 'The gap between districts keeps widening.' },
      ],
    },
  ],

  SCANDAL: {
    title: 'The Clarion Exposé', sfx: 'SCANDAL!', severity: 2,
    text: 'The Daily Clarion publishes internal documents showing Helix Forge knew more than it said. Your phone will not stop ringing.',
    options: [
      { label: 'Full apology and an independent audit', effect: { cash: -60, trust: -6, regulator: -4 }, outcome: 'It hurts. But the story ends this week instead of next year.' },
      { label: 'Deny everything', effect: { trust: -20, regulator: -15 }, outcome: 'A second batch of documents drops the following morning.' },
    ],
  },
  LOBBY_SCANDAL: {
    title: 'Fast-Track Files', sfx: 'LEAKED!', severity: 1,
    text: 'Leaked emails reveal how your lobbyists pressured regulators to rush your approval.',
    options: [
      { label: 'Cut ties with the lobbying firm and testify publicly', effect: { cash: -20, trust: -4, regulator: 2 }, outcome: 'A rough hearing, but you come out the other side.' },
      { label: 'Say nothing', effect: { trust: -12, regulator: -12 }, outcome: 'The silence becomes the story.' },
    ],
  },

  LESSONS: {
    sentinel: [
      { title: 'Meaningful human control', text: 'Since 2014, countries have debated lethal autonomous weapons at the UN Convention on Certain Conventional Weapons. A central idea is keeping humans meaningfully in control of decisions to use force.' },
      { title: 'Risk-tiered rules', text: 'The EU AI Act (in force since August 2024) has banned some uses since February 2025 — including most real-time facial recognition by police in public spaces — and phases in strict requirements for "high-risk" systems from late 2027.' },
      { title: 'Surveillance creep', text: 'In 2019, San Francisco became the first major US city to ban government use of facial recognition. Several other cities followed.' },
    ],
    catalyst: [
      { title: 'Moving too fast', text: 'In 2018, He Jiankui announced the first gene-edited babies. The work was condemned worldwide, and he was sentenced to three years in prison in China.' },
      { title: 'Cures nobody can afford', text: 'Casgevy, the first approved CRISPR therapy (UK and US, late 2023), can be a one-time, potentially curative treatment for sickle cell disease — at a US list price of about $2.2 million per patient.' },
      { title: 'Scientists pressing pause', text: 'In 1974, biologists voluntarily paused risky recombinant-DNA work. At the 1975 Asilomar Conference, they wrote safety guidelines for resuming it — before governments stepped in.' },
    ],
    aetherium: [
      { title: 'Consent is not a checkbox', text: 'The UN Declaration on the Rights of Indigenous Peoples (2007) recognizes the right to free, prior and informed consent for projects on Indigenous lands.' },
      { title: 'Losing your social license', text: 'In 2020, Rio Tinto legally destroyed the 46,000-year-old Juukan Gorge rock shelters in Australia. The public backlash cost its CEO his job.' },
      { title: 'Clean tech, dirty supply chain', text: 'Much of the world\'s cobalt for batteries comes from the DR Congo, where child labor and unsafe mining are well documented. Clean products can depend on harmful supply chains.' },
    ],
    mindlink: [
      { title: 'Neurorights', text: 'In 2021, Chile became the first country to amend its constitution to protect brain activity and the information it produces.' },
      { title: 'Neural data is personal data', text: 'In 2024, Colorado became the first US state to explicitly protect neural data under its privacy law. California followed later that year.' },
      { title: 'From lab to living room', text: 'Neuralink received US FDA approval for its first human trial in 2023 and implanted its first patient in January 2024. Rules for consumer brain devices are still being written.' },
    ],
    frameworks: [
      { title: 'The Collingridge dilemma', text: 'Early on, a technology is easy to change but its effects are hard to predict. Once the effects are clear, it is entrenched and hard to change. That\'s why retrofitting safeguards in Phase II cost 1.5× as much.' },
      { title: 'Responsible innovation: A-R-I-R', text: 'A widely used framework (Stilgoe, Owen & Macnaghten, 2013) asks innovators to Anticipate impacts, Reflect on assumptions, Include affected people, and Respond by changing course.' },
      { title: 'Dual use', text: 'Almost every powerful technology can help or harm. The question is rarely "is it good?" but "under what conditions, for whom, and with what safeguards?"' },
    ],
  },
};
