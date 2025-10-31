DePIN Open-Source Fund
Fund the future. Build on DePIN.

A full-stack, deployable template for a decentralized crowdfunding platform, built for the NodeOps Proof of Build Virtual Hackathon.

This entire application—from the first line of code to the final Dockerfile—was built 100% from a mobile phone to prove the hackathon's mission: "No barriers. No gatekeeping. Everyone's welcome to build."


💡 The Vision
This isn't just a donation platform; it's a template for decentralized, community-driven venture capital.

Our "for-profit" toggle (the "Non-Profit" checkbox) demonstrates a crucial concept:

Non-Profit: The platform acts as a simple, beautiful donation site.

For-Profit (The Vision): The platform is designed to be a launchpad for Web3 startups. The "Pledge!" button is a placeholder for a smart contract interaction. When a user invests, they don't just donate—they get back project tokens, representing real shares or equity in the project's success.

This template is the "front door" for the next generation of DePIN and Web3 startups.

✨ Key Features
Builds on DePIN: Automatically mints all project data and images as permanent NFTs on IPFS/Filecoin via Pinata.

"Liquid Glass" UI: A beautiful, sophisticated, and fully-responsive "glassmorphism" UI with animated "liquid" gradients and a soft aurora background.

Full-Stack Logic: A complete Node.js backend handles project creation, pledging, and database management.

Animated Feedback: Features confetti on success, "toast" notifications that slide down and fade, and animated hover effects.

Funding & Progress: Creators can set a "Pledge Goal." The app tracks progress with a real-time progress bar.

Smart Logic: The app automatically prevents new pledges once a project is fully funded or marked "Complete."

Secure Admin Panel: A "secret" admin panel on each project card is protected by a PIN (hard-coded in index.js) to delete projects.

Database: Uses a simple, reliable db.json file for persistent storage (made deploy-ready with a Docker volume).

🛠️ Technology Stack
Backend: Node.js / Express

Frontend: EJS (Embedded JavaScript)

Styling: Tailwind CSS (for the "liquid glass" UI and animations)

DePIN: IPFS/Filecoin via the Pinata API

Database: A simple db.json file (to ensure maximum portability as a template)

Deployment: Docker / Dockerfile

🚀 How to Run This Template
This template is 100% self-contained.

Clone the Repo:

git clone [https://github.com/Jaden-Nix/nodeops-hackathon.git]
cd [nodeops-hackathon]
Install Dependencies:

npm install
Add Your Secret Key:

Go to index.js.

Find the PINATA_JWT variable (around line 20).

Paste your own free API Key (a JWT) from pinata.cloud.

Run the App:

npm start
The app will be live at http://localhost:3000.

📦 Docker & Deployment (For NodeOps Judges)
This template is fully containerized and ready for the NodeOps Marketplace.

The Dockerfile in the root of this project is optimized for production. It uses a lightweight, multi-stage build based on the node:18-alpine image to ensure a small, secure, and fast-booting container.

It has been explicitly configured with --platform=linux/amd64 to ensure 100% compatibility with the NodeOps deployment architecture.