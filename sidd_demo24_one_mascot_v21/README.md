# BuilderStack 2026 / Developer Community App

Full source code for the official BuilderStack Developer Community web application.

## Tech Stack
- **Framework**: React 18 / 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom fonts (`Space Grotesk`, `Plus Jakarta Sans`, `Fira Code`)
- **Icons**: Lucide React
- **Canvas / 3D**: HTML5 Canvas, CSS 3D Perspective Transforms, Interactive Physics & Kinematics sandboxes

## Features Included
1. **Interactive Verticals (4 Modes)**:
   - **Interactive 2D+3D Lab**:
     - *B/Algo*: Step-by-step Interactive Sorting Algorithm Visualizer with live telemetry (Bubble, Selection, Insertion)
     - *B/Uild*: 2-Joint Inverse Kinematics Robotic Arm simulation with real-time math telemetry & LiDAR radar
     - *B/Hack*: 48-Hour Hackathon Sprint Simulator with live phase tracking and telemetry
     - *B/Dev*: Interactive In-Browser Git Terminal and CLI sandbox
   - **3D Layer Stack**: Isometric 3D card deck with depth tilt & active vertical details
   - **Cyber Bento Grid**: Cursor spotlight tracking shaders & live HUD telemetry
   - **Spatial Holo-Deck**: 3D spatial perspective carousel with rotating cards
2. **Projects Showcase**: Interactive filtering by track, tags, and status
3. **Interactive Timeline / Schedule**: Club calendar and milestones
4. **Team Roster**: Directory of core contributors, mentors, and leads
5. **Live Terminal & RSVP / Badge Modal**: Interactive delegate pass generation

## Getting Started Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or the port shown in terminal) in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
