# Websites

A collection of websites designed and built by **Siddharth**. Each site lives in its own folder and can be run and deployed on its own.

## Sites

| Site | Description | Stack | Folder | Live |
|------|-------------|-------|--------|------|
| B/Stack | Website for our college tech club | React, Vite | [`sidd_demo24_one_mascot_v21`](./sidd_demo24_one_mascot_v21) | (https://websites-smoky-two.vercel.app/) |

_More sites will be added here as I build them._

## Repository Structure

```
Websites-/
├── sidd_demo24_one_mascot_v21/   # B/Stack club website
├── <next-site>/                  # Future sites go in their own folder
└── README.md
```

## Running a Site Locally

Each site is a separate project, so run commands from inside its folder. Most of them use Node.js (v18 or newer recommended).

```bash
# Clone the repository
git clone https://github.com/sidd8824/Websites-.git
cd Websites-

# Go into the site you want to run
cd <site-folder>

# Install dependencies and start the dev server
npm install
npm run dev
```

Then open the local URL shown in the terminal (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

Check each site's own folder for any extra setup notes.

## Deployment

Sites are deployed on [Vercel](https://vercel.com/). When importing a site, set the **Root Directory** to that site's folder.

## Adding a New Site

1. Create a new folder in the repo root for the site.
2. Build it inside that folder with its own `package.json`.
3. Add a row to the **Sites** table above with its description, stack, folder and live link.

## Author

**Siddharth**
GitHub: [@sidd8824](https://github.com/sidd8824)
