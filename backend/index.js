// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');
const ethers = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Pinata (for IPFS)
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

// Connect to Ethereum via ethers (using the Hardhat local node)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = require('../artifacts/contracts/Healthcare.sol/Healthcare.json').abi;
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// Configure Multer for file uploads (to a temp folder)
const upload = multer({ dest: 'uploads/' });

// Upload PDF to IPFS and record in smart contract
app.post('/api/records/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const readableStreamForFile = fs.createReadStream(filePath);

    console.log("Pinning file to IPFS via Pinata...");
    const result = await pinata.pinFileToIPFS(readableStreamForFile);
    fs.unlinkSync(filePath); // remove temp file
    const cid = result.IpfsHash;
    console.log("File pinned, CID:", cid);

    // TEMPORARY: Use a dummy patient address (from Hardhat accounts)
    const defaultPatientAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Call the smart contract to record this CID for the patient
    const tx = await contract.addMedicalRecord(defaultPatientAddress, cid);
    await tx.wait();
    console.log("Medical record added on-chain");

    res.json({ cid });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Endpoint to get medical records for a given patient address
app.get('/api/records/:patient', async (req, res) => {
  try {
    const patient = req.params.patient;
    if (!ethers.isAddress(patient)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    const records = await contract.getMedicalRecords(patient);
    res.json({ records });
  } catch (err) {
    console.error("Error fetching records:", err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
