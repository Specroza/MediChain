This project is developed by Nafiz Al Zawad (https://github.com/nafizalzawad) and Ananna Ayshi Rozario (https://github.com/Specroza)

# MediChain

MediChain is a Blockchain-based Medical Management System designed to securely manage medical records, patient data, and prescription history with transparency, traceability, and tamper-resistance.

## 🚀 Features

- 🔐 Secure patient records stored on blockchain
- 📜 Decentralized access to medical data
- 🧾 Prescription and report tracking
- 👨‍⚕️ Roles for patients, doctors, and administrators
- ☁️ IPFS integration for file storage
- 🔗 Smart contracts for transparent interactions

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Blockchain**: Solidity, Ethereum, Ganache
- **Storage**: IPFS via Pinata
- **Database**: (if used) MongoDB or others
- **Smart Contract Tools**: Hardhat / Truffle (adjust if used)

## 🧪 How to Run Locally

1. **Clone the repo:**

```bash
git clone https://github.com/your-username/MediChain.git
cd MediChain
Install dependencies:

bash
Copy
Edit
cd backend
npm install
Configure environment variables:

Create a .env file in the backend folder and add:

ini
Copy
Edit
PRIVATE_KEY=your_private_key
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=your_deployed_contract_address
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
PORT=5000
Start the backend server:

bash
Copy
Edit
node index.js

