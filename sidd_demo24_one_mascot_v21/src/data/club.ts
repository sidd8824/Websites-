/**
 * B/Stack Club Data Source
 * Bosscoder School of Technology
 * All content is placeholder and configurable in this single file.
 */

export interface Vertical {
  id: 'B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev';
  name: string;
  tagline: string;
  color: string;
  accentBg: string;
  description: string;
  whatYoullDo: string[];
  symbolType: 'algo' | 'unit' | 'hack' | 'dev';
  leadName: string;
}

export interface Project {
  id: string;
  title: string;
  vertical: 'B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev';
  verticalColor: string;
  descriptionLines: [string, string, string, string];
  tags: string[];
  builtBy: string[];
  funFact: string;
  tiltAngle: number;
  badge: string;
  githubUrl: string;
  learnedTakeaways: string[];
  previewGradient: string;
  illustrationSvg: 'rover' | 'code' | 'cloud' | 'trophy' | 'iot';
}

export interface ClubEvent {
  id: string;
  title: string;
  name?: string; // friendly alias for title
  vertical: 'B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev' | 'All';
  verticalColor: string;
  dateStr: string;
  date?: string; // friendly alias for dateStr
  targetIso: string;
  location: string;
  place?: string; // friendly alias for location
  note: string;
  description?: string; // friendly alias for note
  isHeroNextMission?: boolean;
  status: 'upcoming' | 'live' | 'completed';
  registrationUrl?: string;
  link?: string; // friendly alias for registrationUrl
  missionNumber?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatarSeed: string;
  avatarColor: string;
  /** Optional real photo (path or URL). If empty, a cartoon avatar is drawn instead. */
  photoUrl?: string;
  role: string;
  isLead: boolean;
  verticals: ('B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev')[];
  description: string;
  memberSince: string;
  whatIBuild: string;
  funFact: string;
  skills: { label: string; level: number }[];
  github: string;
  linkedin: string;
  email: string;
}

export const CLUB_META = {
  name: 'B/Stack',
  fullName: 'B/Stack',
  institution: 'Bosscoder School of Technology',
  heroSubtitle: 'The tech club of Bosscoder School of Technology',
  taglines: [
    'B/Algo · B/Uild · B/Hack · B/Dev',
    'MAKE · BREAK · SHIP',
    'STUDENT BUILDERS',
  ],
  stats: [
    { value: 'XX+', label: 'members', targetNum: 140 },
    { value: 'XX+', label: 'projects', targetNum: 42 },
    { value: 'XX+', label: 'events', targetNum: 28 },
    { value: '4', label: 'verticals', targetNum: 4 },
  ],
  established: 'EST. 20XX',
  socials: {
    github: 'https://github.com/b-stack',
    instagram: 'https://instagram.com/bstack_club',
    linkedin: 'https://linkedin.com/company/b-stack',
    email: 'crew@bstack.tech',
  },
};

export const VERTICALS: Record<Vertical['id'], Vertical> = {
  'B/Algo': {
    id: 'B/Algo',
    name: 'B/Algo',
    tagline: 'computer programming and problem solving',
    color: '#7F77DD',
    accentBg: 'rgba(127, 119, 221, 0.16)',
    description: 'Master advanced algorithms, competitive sprints, computational geometry, and algorithmic art.',
    whatYoullDo: [
      'Solve graph theory, DP, and dynamic tree puzzles under clock pressure',
      'Compete in collegiate algorithmic battles, ICPC qualifiers & weekly heats',
      'Optimize hot code paths to sub-millisecond execution times',
    ],
    symbolType: 'algo',
    leadName: 'Member name (Algo Lead)',
  },
  'B/Uild': {
    id: 'B/Uild',
    name: 'B/Uild',
    tagline: 'robotics and hardware',
    color: '#1D9E75',
    accentBg: 'rgba(29, 158, 117, 0.16)',
    description: 'Bridge firmware with the physical realm: soldering circuits, CAD mechanics, sensor telemetry, and rovers.',
    whatYoullDo: [
      'Design modular PCBs, motor controllers & telemetry transceivers',
      'Assemble autonomous rovers with computer vision and LiDAR navigation',
      'Compete in university hardware hackathons and combat robotics arenas',
    ],
    symbolType: 'unit',
    leadName: 'Member name (Unit Lead)',
  },
  'B/Hack': {
    id: 'B/Hack',
    name: 'B/Hack',
    tagline: 'hackathons and team challenges',
    color: '#D85A30',
    accentBg: 'rgba(216, 90, 48, 0.16)',
    description: 'Assemble lightning-fast cross-discipline squads to turn wild ideas into functional moonshots in 36 hours.',
    whatYoullDo: [
      'Master rapid ideation, wireframing, pitch rehearsal & sleepless sprint stamina',
      'Participate in national and international hackathon road trips',
      'Ship polished MVPs with real users before Sunday demo judging',
    ],
    symbolType: 'hack',
    leadName: 'Member name (Hack Lead)',
  },
  'B/Dev': {
    id: 'B/Dev',
    name: 'B/Dev',
    tagline: 'open source and web development',
    color: '#378ADD',
    accentBg: 'rgba(55, 138, 221, 0.16)',
    description: 'Craft high-performance distributed systems, modern web platforms, and contribute to world-class OSS repos.',
    whatYoullDo: [
      'Build scalable web stacks with TypeScript, React, Rust, and Go',
      'Contribute upstream PRs to major open-source ecosystems',
      'Deploy and maintain developer tooling for the college student body',
    ],
    symbolType: 'dev',
    leadName: 'Member name (Dev Lead)',
  },
};

export const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Project name 01: RoboStack Rover',
    vertical: 'B/Uild',
    verticalColor: '#1D9E75',
    descriptionLines: [
      'A 6-wheeled terrain rover engineered with dual ESP32 chips and customized planetary gearboxes.',
      'Constructed using laser-cut acrylic, 3D printed ABS suspension arms, and differential steering kinematics.',
      'During testing on campus gravel, motor driver thermal throttling caught fire; rebuilt with copper heat-sinks.',
      'Now autonomously maps campus hallways with 2D LiDAR and streams live telemetry to a browser dashboard.',
    ],
    tags: ['ESP32', 'ROS2', 'C++', 'FreeRTOS', '3D Print'],
    builtBy: ['Member name (Lead)', 'Member name', 'Member name'],
    funFact: 'Survived an accidental 1.2-meter drop off the engineering stairs with zero frame fractures!',
    tiltAngle: -2.5,
    badge: 'HARDWARE PROTOTYPE',
    githubUrl: 'https://github.com/b-stack/robostack-rover',
    learnedTakeaways: [
      'Brushless ESC firmware calibration requires precise deadband curves',
      'LiDAR SLAM accuracy doubles when fused with wheel encoder odometry',
      'Always install accessible emergency hardware kill-switches',
    ],
    previewGradient: 'from-[#1D9E75] to-[#0B1226]',
    illustrationSvg: 'rover',
  },
  {
    id: 'proj-2',
    title: 'Project name 02: AlgoDuel Arena',
    vertical: 'B/Algo',
    verticalColor: '#7F77DD',
    descriptionLines: [
      'A multiplayer 1v1 terminal & web battleground where coders duel to solve randomized algorithmic teasers.',
      'Powered by an isolated Docker sandbox runner measuring memory allocations and microsecond CPU ticks.',
      'Encountered race conditions when both players submitted simultaneous AST patches on WebSocket sync.',
      'Handles over 500 concurrent matches with millisecond leaderboard sync and interactive visual test cases.',
    ],
    tags: ['Go', 'TypeScript', 'Docker', 'WebSockets', 'Redis'],
    builtBy: ['Member name (Algo Lead)', 'Member name'],
    funFact: 'Our fastest player solved a hard DP Knapsack variation in exactly 43 seconds flat.',
    tiltAngle: 2.8,
    badge: 'COMPETITIVE ENGINE',
    githubUrl: 'https://github.com/b-stack/algoduel-arena',
    learnedTakeaways: [
      'Securing user-submitted untrusted code requires cgroups v2 resource quotas',
      'Real-time syntax diffing reduces WebSocket payload size by 84%',
      'Predictive input buffering keeps duels responsive even at high latency',
    ],
    previewGradient: 'from-[#7F77DD] to-[#26215C]',
    illustrationSvg: 'code',
  },
  {
    id: 'proj-3',
    title: 'Project name 03: OmniSync OSS',
    vertical: 'B/Dev',
    verticalColor: '#378ADD',
    descriptionLines: [
      'A zero-config peer-to-peer file synchronization daemon built entirely for local campus networks.',
      'Written in Rust with WebRTC data channels, multicast DNS discovery, and end-to-end ChaCha20 encryption.',
      'Cross-subnet UDP broadcast packets were repeatedly blocked by university campus firewall switches.',
      'Pioneered automatic STUN hole punching and relay fallback, maintaining 90MB/s sustained transfers.',
    ],
    tags: ['Rust', 'WebRTC', 'Tauri', 'mDNS', 'Cryptography'],
    builtBy: ['Member name (Dev Lead)', 'Member name', 'Member name'],
    funFact: 'Shared over 14 Terabytes of lecture slides and Linux ISOs across campus dorms in week one.',
    tiltAngle: -1.8,
    badge: 'OPEN SOURCE 800+ ★',
    githubUrl: 'https://github.com/b-stack/omnisync-oss',
    learnedTakeaways: [
      'Zero-copy buffer slicing in Rust preserves battery life on laptops',
      'mDNS broadcast requires careful packet rate limiting to prevent network flood',
      'Writing cross-platform GUI with Tauri halved memory usage compared to Electron',
    ],
    previewGradient: 'from-[#378ADD] to-[#151038]',
    illustrationSvg: 'cloud',
  },
  {
    id: 'proj-4',
    title: 'Project name 04: HackGrid Live',
    vertical: 'B/Hack',
    verticalColor: '#D85A30',
    descriptionLines: [
      'An all-in-one 36-hour hackathon management cockpit handling team matching, mentor queues, and judging.',
      'Features a real-time matrix display of all hacker booths with live status flags and SMS alert webhooks.',
      'At 3 AM during a 600-person hackathon, the database connection pool starved under simultaneous check-ins.',
      'Hot-patched with optimistic UI caches and survived 42 judges grading 88 projects simultaneously.',
    ],
    tags: ['Next.js', 'PostgreSQL', 'Twilio', 'Tailwind', 'Node.js'],
    builtBy: ['Member name (Hack Lead)', 'Member name'],
    funFact: 'Powered 4 inter-collegiate hackathons and dispatched 3,400 slice-of-pizza notifications!',
    tiltAngle: 3.2,
    badge: 'HACKATHON CHAMPION',
    githubUrl: 'https://github.com/b-stack/hackgrid-live',
    learnedTakeaways: [
      'Judging queues need deterministic round-robin assignment to avoid judge fatigue',
      'Optimistic mutations with toast rollbacks keep UI snappy on dodgy venue Wi-Fi',
      'Always have offline fallback sheets ready for venue network blackout',
    ],
    previewGradient: 'from-[#D85A30] to-[#2A1426]',
    illustrationSvg: 'trophy',
  },
  {
    id: 'proj-5',
    title: 'Project name 05: EcoSense IoT Mesh',
    vertical: 'B/Uild',
    verticalColor: '#1D9E75',
    descriptionLines: [
      'A solar-powered environmental sensor mesh monitoring campus classroom air quality and ambient acoustics.',
      'Built with ultra-low-power Nordic nRF52 BLE beacons relaying telemetry over a Zigbee sub-GHz mesh.',
      'Water ingress during monsoon season shorted three rooftop sensory nodes; redesigned with silicone gaskets.',
      'Data streams directly to an interactive 3D voxel heatmap viewable by facility managers on campus.',
    ],
    tags: ['nRF52', 'Zigbee', 'Solar Energy', 'Sensors', 'Three.js'],
    builtBy: ['Member name', 'Member name', 'Member name'],
    funFact: 'Detected an unventilated chemistry lab spike 14 minutes before the building alarm activated.',
    tiltAngle: -2.0,
    badge: 'SMART CAMPUS IOT',
    githubUrl: 'https://github.com/b-stack/ecosense-iot',
    learnedTakeaways: [
      'Solar energy harvesting requires dynamic deep-sleep cycle algorithms',
      'Outdoor IP67 housing design is as vital as the circuit schematic itself',
      'Sensor calibration curves drift over time without baseline auto-zeroing',
    ],
    previewGradient: 'from-[#1D9E75] to-[#14122E]',
    illustrationSvg: 'iot',
  },
];

export const EVENTS: ClubEvent[] = [
  {
    id: 'evt-hero',
    title: 'B/Hack Sprint 20XX: 36-Hour Hackathon Mission',
    vertical: 'B/Hack',
    verticalColor: '#D85A30',
    dateStr: 'November 14-16, 20XX',
    targetIso: '2026-11-14T09:00:00',
    location: 'Bosscoder Tech Hall & Virtual Arena',
    note: 'Build, break, and ship moonshot prototypes in 36 hours. Mentors, prizes, food, and midnight pizza included!',
    isHeroNextMission: true,
    status: 'upcoming',
    registrationUrl: '#join',
    missionNumber: 'MISSION 042',
  },
  {
    id: 'evt-2',
    title: 'B/Algo: Graph Traversal & Dynamic Programming Heats',
    vertical: 'B/Algo',
    verticalColor: '#7F77DD',
    dateStr: 'November 22, 20XX · 18:00',
    targetIso: '2026-11-22T18:00:00',
    location: 'Lab 402, Bosscoder School of Tech',
    note: 'Deep dive into Dijkstra variations, topological sorts, and ICPC tournament speed drills.',
    status: 'upcoming',
  },
  {
    id: 'evt-3',
    title: 'B/Uild: Quadcopter PCB & ESC Soldering Bootcamp',
    vertical: 'B/Uild',
    verticalColor: '#1D9E75',
    dateStr: 'December 05, 20XX · 14:00',
    targetIso: '2026-12-05T14:00:00',
    location: 'Maker Garage & Robotics Lab',
    note: 'Hands-on surface mount soldering, flight controller flashing, and propeller balancing test bench.',
    status: 'upcoming',
  },
  {
    id: 'evt-4',
    title: 'B/Dev: Fullstack Rust & WebAssembly Workshop',
    vertical: 'B/Dev',
    verticalColor: '#378ADD',
    dateStr: 'December 12, 20XX · 17:00',
    targetIso: '2026-12-12T17:00:00',
    location: 'Auditorium B & Live Stream',
    note: 'Compiling high-performance native routines into the browser and building zero-overhead UI apps.',
    status: 'upcoming',
  },
  {
    id: 'evt-past-1',
    title: 'Event 01: Freshmen Hardware & Algo Kickoff',
    vertical: 'All',
    verticalColor: '#DDEB6B',
    dateStr: 'September 20XX',
    targetIso: '2026-09-10T10:00:00',
    location: 'Main Amphitheater',
    note: 'Welcomed 200+ curious builders with live rover demonstrations and lightning coding puzzles.',
    status: 'completed',
    missionNumber: 'MISSION 038',
  },
  {
    id: 'evt-past-2',
    title: 'Event 02: B/Hack Inter-College Invitational',
    vertical: 'B/Hack',
    verticalColor: '#D85A30',
    dateStr: 'October 20XX',
    targetIso: '2026-10-02T09:00:00',
    location: 'Bosscoder Tech Hall',
    note: '40 teams, 12 judges, and 3 winner trophies awarded for revolutionary campus tools.',
    status: 'completed',
    missionNumber: 'MISSION 039',
  },
  {
    id: 'evt-past-3',
    title: 'Event 03: Global Open Source Hacktober Push',
    vertical: 'B/Dev',
    verticalColor: '#378ADD',
    dateStr: 'October 08, 20XX',
    targetIso: '2026-10-08T16:00:00',
    location: 'Virtual OSS Hub',
    note: 'Merged 112 pull requests across 18 public GitHub repositories in a single weekend.',
    status: 'completed',
    missionNumber: 'MISSION 040',
  },
  {
    id: 'evt-past-4',
    title: 'Event 04: BattleBots Campus Demolition Derby',
    vertical: 'B/Uild',
    verticalColor: '#1D9E75',
    dateStr: 'October 14, 20XX',
    targetIso: '2026-10-14T15:00:00',
    location: 'Campus Arena',
    note: '8 custom-built 3kg combat robots clashed in our reinforced polycarbonate cage arena.',
    status: 'completed',
    missionNumber: 'MISSION 041',
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'Member name 01',
    avatarSeed: 'algo-lead',
    avatarColor: '#7F77DD',
    role: 'B/Algo Lead & Systems Builder',
    isLead: true,
    verticals: ['B/Algo', 'B/Dev'],
    description: 'Graph algorithm geek and compiler enthusiast. Always refactoring solutions to O(log n).',
    memberSince: '20XX',
    whatIBuild: 'Competitive code sandboxes, AST parsers, and high-frequency matching engines.',
    funFact: 'Has never used a debugger — prints everything to stdout with custom ASCII formatting.',
    skills: [
      { label: 'Competitive Programming', level: 96 },
      { label: 'Data Structures & Algorithms', level: 94 },
      { label: 'C++ & Rust', level: 88 },
      { label: 'Systems Architecture', level: 82 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member01@bstack.tech',
  },
  {
    id: 'mem-2',
    name: 'Member name 02',
    avatarSeed: 'unit-lead',
    avatarColor: '#1D9E75',
    role: 'B/Uild Lead & Robotics Architect',
    isLead: true,
    verticals: ['B/Uild', 'B/Hack'],
    description: 'Hardware hacker who believes no problem is complete without a brushless motor and solder smoke.',
    memberSince: '20XX',
    whatIBuild: 'LiDAR rovers, custom flight controllers, and autonomous obstacle avoidance robots.',
    funFact: 'Owns 14 microcontrollers and carries a multimeter in their daily backpack.',
    skills: [
      { label: 'Embedded C & RTOS', level: 95 },
      { label: 'PCB Schematic & CAD', level: 91 },
      { label: 'Robotics Kinematics', level: 89 },
      { label: 'Rapid Prototyping', level: 86 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member02@bstack.tech',
  },
  {
    id: 'mem-3',
    name: 'Member name 03',
    avatarSeed: 'hack-lead',
    avatarColor: '#D85A30',
    role: 'B/Hack Lead & Sprint Strategist',
    isLead: true,
    verticals: ['B/Hack', 'B/Dev'],
    description: 'Serial hackathon builder with a passion for 3 AM energy drinks and game-changing demo pitches.',
    memberSince: '20XX',
    whatIBuild: 'Fullstack hackathon MVPs, pitch decks that win trophies, and instant APIs.',
    funFact: 'Won 5 hackathons in 6 months across 3 different cities on 4 hours of collective sleep.',
    skills: [
      { label: 'Hackathon Sprint Mastery', level: 98 },
      { label: 'Product Architecture', level: 92 },
      { label: 'UI / UX Polish', level: 87 },
      { label: 'Rapid Pitch Crafting', level: 94 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member03@bstack.tech',
  },
  {
    id: 'mem-4',
    name: 'Member name 04',
    avatarSeed: 'dev-lead',
    avatarColor: '#378ADD',
    role: 'B/Dev Lead & OSS Maintainer',
    isLead: true,
    verticals: ['B/Dev', 'B/Algo'],
    description: 'Open source advocate crafting responsive web experiences, CLI tools, and distributed backends.',
    memberSince: '20XX',
    whatIBuild: 'Distributed P2P networks, web infrastructure, and TypeScript libraries.',
    funFact: 'Has maintained a 400-day GitHub green contribution streak while maintaining 8 OSS repos.',
    skills: [
      { label: 'TypeScript & React', level: 95 },
      { label: 'Open Source Tooling', level: 93 },
      { label: 'WebSockets & Realtime', level: 89 },
      { label: 'Cloud & Docker', level: 85 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member04@bstack.tech',
  },
  {
    id: 'mem-5',
    name: 'Member name 05',
    avatarSeed: 'polymath-1',
    avatarColor: '#7F77DD',
    role: 'Quad-Vertical Explorer',
    isLead: false,
    verticals: ['B/Algo', 'B/Uild', 'B/Hack', 'B/Dev'],
    description: 'Curious builder who refuses to pick a single lane. Bridges firmware, algorithms, and web dashboards.',
    memberSince: '20XX',
    whatIBuild: 'Sensor telemetry hubs with real-time algorithm visualizers and web interfaces.',
    funFact: 'Once built an IoT toaster that notifies you on Telegram when bread hits optimal crispness.',
    skills: [
      { label: 'Cross-Stack Integration', level: 90 },
      { label: 'Python & C++', level: 88 },
      { label: 'Hardware Interfacing', level: 84 },
      { label: 'Algorithm Design', level: 82 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member05@bstack.tech',
  },
  {
    id: 'mem-6',
    name: 'Member name 06',
    avatarSeed: 'unit-builder',
    avatarColor: '#1D9E75',
    role: 'Mechanical CAD & Firmware Specialist',
    isLead: false,
    verticals: ['B/Uild'],
    description: 'Focuses on structural FEA analysis, 3D printing tolerances, and brushless motor driver boards.',
    memberSince: '20XX',
    whatIBuild: 'Robot gearboxes, robotic arm grippers, and waterproof sensor enclosures.',
    funFact: 'Can calibrate a 3D printer bed purely by listening to the stepper motor resonance.',
    skills: [
      { label: '3D CAD & Mechanics', level: 92 },
      { label: 'KiCAD & PCB Routing', level: 89 },
      { label: 'Microcontroller Firmware', level: 83 },
      { label: 'Hardware Debugging', level: 88 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member06@bstack.tech',
  },
  {
    id: 'mem-7',
    name: 'Member name 07',
    avatarSeed: 'algo-hacker',
    avatarColor: '#7F77DD',
    role: 'Competitive Programmer & Math Mind',
    isLead: false,
    verticals: ['B/Algo', 'B/Hack'],
    description: 'Turns complex mathematical formulas and dynamic programming grids into blazing fast C++ code.',
    memberSince: '20XX',
    whatIBuild: 'Math libraries, competitive contest generators, and game AI solvers.',
    funFact: 'Solved all Project Euler problems up to #100 before taking introductory university physics.',
    skills: [
      { label: 'Number Theory & Combinatorics', level: 94 },
      { label: 'C++ Competitive Standard', level: 92 },
      { label: 'Code Optimization', level: 86 },
      { label: 'Rapid Problem Decomposition', level: 89 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member07@bstack.tech',
  },
  {
    id: 'mem-8',
    name: 'Member name 08',
    avatarSeed: 'web-designer',
    avatarColor: '#378ADD',
    role: 'Frontend Creative & 3D Web Artisan',
    isLead: false,
    verticals: ['B/Dev', 'B/Hack'],
    description: 'Passionate about tactile micro-interactions, brutalist typography, WebGL shaders, and smooth scroll.',
    memberSince: '20XX',
    whatIBuild: 'Interactive club web experiences, generative shader canvases, and design token libraries.',
    funFact: 'Spends 2 hours picking the exact bezier easing curve for a 200ms button hover.',
    skills: [
      { label: 'WebGL & Three.js', level: 91 },
      { label: 'CSS Architecture & Motion', level: 95 },
      { label: 'Interactive UI Design', level: 92 },
      { label: 'React & Vite Ecosystem', level: 90 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member08@bstack.tech',
  },
  {
    id: 'mem-9',
    name: 'Member name 09',
    avatarSeed: 'systems-unit',
    avatarColor: '#1D9E75',
    role: 'IoT & Telemetry Engineer',
    isLead: false,
    verticals: ['B/Uild', 'B/Dev'],
    description: 'Wires environmental sensors across campus and streams the packets straight into real-time web graphs.',
    memberSince: '20XX',
    whatIBuild: 'Sub-GHz mesh networks, MQTT telemetry brokers, and sensor health dashboards.',
    funFact: 'Put a temperature sensor inside their dorm fridge to detect roomie snack-stealing raids.',
    skills: [
      { label: 'BLE & Zigbee Mesh', level: 89 },
      { label: 'MQTT & WebSockets', level: 88 },
      { label: 'Low-Power Firmware', level: 85 },
      { label: 'TypeScript Backends', level: 81 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member09@bstack.tech',
  },
  {
    id: 'mem-10',
    name: 'Member name 10',
    avatarSeed: 'hack-squad',
    avatarColor: '#D85A30',
    role: 'Product Strategist & Fullstack Builder',
    isLead: false,
    verticals: ['B/Hack'],
    description: 'Turns fuzzy user problems into crisp hackathon project roadmaps, wireframes, and production apps.',
    memberSince: '20XX',
    whatIBuild: 'Rapid SaaS prototypes, student utility bots, and hackathon judging dashboards.',
    funFact: 'Has created over 40 Figma prototypes in one weekend during an international design jam.',
    skills: [
      { label: 'Rapid Prototyping', level: 93 },
      { label: 'Product Ideation', level: 91 },
      { label: 'Node.js & Next.js', level: 87 },
      { label: 'Pitch Presentation', level: 92 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member10@bstack.tech',
  },
  {
    id: 'mem-11',
    name: 'Member name 11',
    avatarSeed: 'dev-security',
    avatarColor: '#378ADD',
    role: 'Security & Infrastructure Specialist',
    isLead: false,
    verticals: ['B/Dev', 'B/Algo'],
    description: 'Keeps club servers bulletproof, sets up CI/CD pipelines, and writes CTF exploitation challenges.',
    memberSince: '20XX',
    whatIBuild: 'Automated CI/CD test runners, authentication layers, and sandboxed CTF arenas.',
    funFact: 'Found an accidental open redis port on campus and politely submitted a white-hat disclosure report.',
    skills: [
      { label: 'Linux & Docker Security', level: 90 },
      { label: 'Go & Python Scripting', level: 88 },
      { label: 'Network Protocols', level: 86 },
      { label: 'Reverse Engineering', level: 82 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member11@bstack.tech',
  },
  {
    id: 'mem-12',
    name: 'Member name 12',
    avatarSeed: 'algo-visualizer',
    avatarColor: '#7F77DD',
    role: 'Data Structures & Graphics Tinkerer',
    isLead: false,
    verticals: ['B/Algo', 'B/Dev', 'B/Uild'],
    description: 'Enjoys rendering complex graphs and tree traversals in animated 3D space with high framerates.',
    memberSince: '20XX',
    whatIBuild: 'Interactive tree and graph visualizers, maze solving bots, and spatial algorithms.',
    funFact: 'Drew a 10,000-node graph on graph paper by hand just to check an edge case.',
    skills: [
      { label: 'Spatial Algorithms', level: 89 },
      { label: 'Canvas & SVG Animation', level: 92 },
      { label: 'C++ & Python', level: 86 },
      { label: 'Hardware Telemetry', level: 80 },
    ],
    github: 'https://github.com/b-stack',
    linkedin: 'https://linkedin.com',
    email: 'member12@bstack.tech',
  },
];
