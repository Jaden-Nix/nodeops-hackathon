/*
=====================================================
  DePIN OPEN-SOURCE FUND - FINAL BACKEND
  Features:
  - Create Project (w/ Pledge Goal)
  - Mint to Pinata (DePIN)
  - Save to JSON DB
  - Pledge to Project (w/ Guard)
  - Complete Project
  - Admin: Clear DB
  - Admin: Delete Project (w/ PIN)
  - Admin: Contact Link
=====================================================
*/
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const dbPath = path.join(__dirname, 'db.json');

// --- Middleware ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// --- API Token (Hard-coded for Hackathon) ---
// PASTE YOUR PINATA JWT TOKEN (the long one) IN THE QUOTES BELOW
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmZTg2YzY2Mi1iOTA2LTRjMTgtYmY5Yi1kYzM2Y2FhYTQ3ZGEiLCJlbWFpbCI6ImR1c3RuaXh4aWVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImNmYjY3OWZkMTk2YzYxYTU0OTc1Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjI2M2VkZTQ4MGM1ZjNiMzJjMTdhNDdiZGY3Mzc0YzAzZDA5ZGE1ZjkxYTc0YmQyMDEzYzJkYjI1ZjI2ODcyMCIsImV4cCI6MTc5MzE4Mzg0NH0.zvyrtXAw8as-KiW0dsDZknx98xugPCFFs3GzKHZgvjk";
const MASTER_ADMIN_PIN = "2004"; // Keep this simple for the demo

// --- Database Helper Functions ---
async function readDB() {
  try {
    const data = await fs.promises.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB:", err);
    return { projects: [] }; // Return a default structure if DB file is broken
  }
}

async function writeDB(data) {
  try {
    await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}

// --- Routes ---

/**
 * Route 1: GET / (Main Page)
 * Show all projects from the database.
 */
app.get('/', async (req, res) => {
  const incomingError = req.query.error || null;
  const incomingSuccess = req.query.success || null;

  console.log('--- (GET /) Loading main page ---');

  try {
    const db = await readDB();
    const validProjects = db.projects.filter(p => p && p.id); // Filter out any null/bad data

    console.log(`--- (GET /) Found ${db.projects.length} total projects, ${validProjects.length} are valid.`);

    // Sort projects: "funding" first, then "complete"
    validProjects.sort((a, b) => {
      if (a.status === 'funding' && b.status !== 'funding') return -1;
      if (a.status !== 'funding' && b.status === 'funding') return 1;
      return 0; // Keep original order if status is same
    });

    res.render('index', { projects: validProjects, error: incomingError, success: incomingSuccess });
  } catch (err) {
    console.error('--- (GET /) CRITICAL ERROR loading page:', err);
    res.render('index', { projects: [], error: incomingError || 'Database connection failed.', success: null });
  }
});


/**
 * Route 2: POST /create (w/ Pinata Logic)
 * Creates a new project.
 */
app.post('/create', upload.single('fileToUpload'), async (req, res) => {
  console.log('--- (POST /create) Create route hit ---');

  if (!PINATA_JWT || PINATA_JWT === "PASTE_YOUR_PINATA_JWT_TOKEN_HERE") {
    console.error('--- (POST /create) Pinata key is missing!');
    return res.redirect('/?error=Server not configured');
  }

  // --- NEW: Added contactLink ---
  const { name, description, githubLink, fundingGoal, isNonProfit, contactLink } = req.body;
  const file = req.file;

  // --- NEW: Added contactLink to validation ---
  if (!name || !description || !githubLink || !fundingGoal || !file || !contactLink) {
    console.error('--- (POST /create) Form fields were missing!');
    return res.redirect('/?error=All fields are required.');
  }

  console.log('--- (POST /create) Minting DePIN Pledge NFT...');

  try {
    // 1. Upload the image file to Pinata
    console.log('--- (POST /create) Uploading image to Pinata...');
    const formData = new FormData();
    const stream = Readable.from(file.buffer);
    formData.append('file', stream, { filename: file.originalname });

    const imageUploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      { headers: { ...formData.getHeaders(), "Authorization": `Bearer ${PINATA_JWT}` } }
    );
    const imageCid = imageUploadResponse.data.IpfsHash;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
    console.log(`--- (POST /create) Image success! URL: ${imageUrl}`);

    // 2. Create the metadata.json object
    const metadata = { 
      name, 
      description, 
      image: imageUrl, 
      properties: { 
        githubLink, 
        contactLink, // --- NEW: Added contactLink to metadata ---
        type: 'OpenSourcePledge',
        isNonProfit: isNonProfit ? 'true' : 'false'
      } 
    };

    // 3. Upload the metadata.json to Pinata
    console.log('--- (POST /create) Uploading metadata to Pinata...');
    const metadataUploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      { headers: { "Authorization": `Bearer ${PINATA_JWT}` } }
    );
    const metadataCid = metadataUploadResponse.data.IpfsHash;
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;
    console.log(`--- (POST /create) Metadata success! URL: ${metadataUrl}`);

    // 4. Save the project to the JSON DB
    const id = crypto.randomUUID();
    const projectData = { 
      id, 
      name, 
      description, 
      githubLink, 
      contactLink, // --- NEW: Added contactLink to DB object ---
      fundingGoal: parseInt(fundingGoal, 10), // Ensure it's a number
      isNonProfit: isNonProfit ? true : false,
      metadataUrl, 
      pledges: 0, 
      status: 'funding' // 'funding' or 'complete'
    };

    console.log(`--- (POST /create) Saving project ${id} to database...`);
    const db = await readDB();
    db.projects.push(projectData);
    await writeDB(db);
    console.log(`--- (POST /create) SUCCESS: Saved project ${id} to database.`);

    // REDIRECT WITH A SUCCESS MESSAGE!
    res.redirect('/?success=Project created! Scroll down to see it.');
  } catch (err) {
    const errorMsg = err.response ? err.response.data : err.message;
    console.error("--- (POST /create) CRITICAL ERROR during create:", errorMsg);
    // Log the full error for deep debugging if needed
    if (err.response) {
      console.error("Pinata Response Status:", err.response.status);
      console.error("Pinata Response Headers:", err.response.headers);
    }
    res.redirect('/?error=Failed to mint DePIN NFT. Check server logs.');
  }
});


/**
 * Route 3: POST /pledge/:id
 * Adds a pledge to a project.
 */
app.post('/pledge/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`--- (POST /pledge) Pledge received for ${id} ---`);

  const db = await readDB();
  const project = db.projects.find(p => p.id === id);

  if (!project) {
    return res.redirect('/?error=Project not found.');
  }

  // --- NEW PLEDGE GUARD ---
  if (project.status === 'complete' || project.pledges >= project.fundingGoal) {
    console.warn(`--- (POST /pledge) Blocked pledge for ${id}. Project is already funded.`);
    return res.redirect('/?error=This project is already fully funded!');
  }

  project.pledges += 1;
  await writeDB(db);
  console.log(`--- (POST /pledge) Pledge successful for ${id}. Total: ${project.pledges}`);

  // --- NEW: Added success toast ---
  res.redirect('/?success=Pledge successful! Thank you for your support.');
});

/**
 * Route 4: POST /complete/:id
 * Manually marks a project as complete.
 */
app.post('/complete/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`--- (POST /complete) Mark as complete for ${id} ---`);

  const db = await readDB();
  const project = db.projects.find(p => p.id === id);

  if (!project) {
    return res.redirect('/?error=Project not found.');
  }

  project.status = 'complete';
  await writeDB(db);
  console.log(`--- (POST /complete) Project ${id} marked as complete.`);

  // --- NEW: Added success toast ---
  res.redirect('/?success=Project marked as complete!');
});

/**
 * Route 5: POST /delete/:id (Admin)
 * Deletes a project.
 */
app.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const { adminPin } = req.body;
  console.log(`--- (POST /delete) Delete attempt for ${id} ---`);

  if (adminPin !== MASTER_ADMIN_PIN) {
    console.warn(`--- (POST /delete) FAILED delete for ${id}: Wrong PIN`);
    return res.redirect('/?error=Wrong Admin PIN.');
  }

  const db = await readDB();
  db.projects = db.projects.filter(p => p.id !== id);
  await writeDB(db);

  console.log(`--- (POST /delete) SUCCESS: Deleted project ${id}`);
  res.redirect('/?success=Admin: Project deleted.');
});

/**
 * Route 6: GET /admin/clear (Admin)
 * Deletes ALL projects.
 */
app.get('/admin/clear', async (req, res) => {
  console.log('--- ADMIN: CLEARING DATABASE ---');
  try {
    const db = { projects: [] };
    await writeDB(db);
    console.log('--- ADMIN: DATABASE CLEARED ---');
    res.redirect('/?success=Admin: All test projects cleared!');
  } catch (err) {
    console.error('--- ADMIN: FAILED TO CLEAR ---', err);
    res.redirect('/?error=Failed to clear DB');
  }
});


// --- Start Server ---
const port = 3000;
app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`);
  // Check if DB exists, if not, create it
  if (!fs.existsSync(dbPath)) {
    console.log('--- DB: No db.json found, creating one... ---');
    writeDB({ projects: [] });
  }
});


