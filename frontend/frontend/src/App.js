// src/App.js
import './App.css';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Healthcare from './contracts/Healthcare.json';  // ABI of the contract

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [medication, setMedication] = useState("");

  // Connect to MetaMask on component mount
  async function connectWallet() {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        // Initialize contract
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
        const hc = new ethers.Contract(contractAddress, Healthcare.abi, signer);
        setContract(hc);
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  }

  // UI: role selection
  function handleRoleChange(e) {
    setRole(e.target.value);
  }

  // Patient actions
  async function handleUploadRecord(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Upload to backend API (Node.js)
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:5000/api/records/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const cid = res.data.cid;
    alert(`File uploaded to IPFS: ${cid}`);
    // (Contract call was done server-side for demo)
  }

  async function handleGrantDoctor() {
    try {
      const tx = await contract.grantDoctorAccess(patientAddress);
      await tx.wait();
      alert("Doctor access granted!");
    } catch(err) {
      alert("Error: " + err.message);
    }
  }

  // Doctor actions
  async function handleCreatePrescription() {
    try {
      const tx = await contract.createPrescription(patientAddress, medication);
      await tx.wait();
      alert("Prescription created!");
    } catch(err) {
      alert("Error: " + err.message);
    }
  }

  // Pharmacist actions
  async function handleDispense() {
    try {
      const tx = await contract.markAsDispensed(parseInt(patientAddress)); // misuse patientAddress field for prescriptionId
      await tx.wait();
      alert("Marked as dispensed!");
    } catch(err) {
      alert("Error: " + err.message);
    }
  }

  // Insurance actions
  async function handleApprove() {
    try {
      const tx = await contract.approveClaim(parseInt(patientAddress));
      await tx.wait();
      alert("Claim approved!");
    } catch(err) {
      alert("Error: " + err.message);
    }
  }

  // Render UI based on role
  return (
  <div className="min-h-screen bg-gray-100 text-gray-800 p-8 font-sans">
    {!account && 
      <button 
        onClick={connectWallet}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Connect MetaMask
      </button>
    }

    {account && !role && (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Welcome, <span className="text-blue-600">{account}</span></h2>
        <div>
          <label className="block mb-1 font-medium">Select Role:</label>
          <select 
            onChange={handleRoleChange}
            className="border border-gray-300 px-3 py-2 rounded w-full"
          >
            <option value="">-- Choose --</option>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Insurance">Insurance</option>
          </select>
        </div>
      </div>
    )}

    {account && role === "Patient" && (
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold">Patient Dashboard</h3>

        <div>
          <p className="mb-2">Register as Patient:</p>
          <button 
            onClick={async () => {
              await contract.registerAsPatient();
              alert("Registered as patient");
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Register
          </button>
        </div>

        <div>
          <p className="mb-2">Upload Medical Record (PDF):</p>
          <input 
            type="file" accept="application/pdf" 
            onChange={handleUploadRecord}
            className="border p-2"
          />
        </div>

        <div>
          <p className="mb-2">Grant Doctor Access:</p>
          <input 
            type="text"
            placeholder="Doctor Address"
            value={patientAddress}
            onChange={e => setPatientAddress(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <button 
            onClick={handleGrantDoctor}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Grant Access
          </button>
        </div>
      </div>
    )}

    {account && role === "Doctor" && (
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold">Doctor Dashboard</h3>
        <input 
          type="text" placeholder="Patient Address" 
          value={patientAddress}
          onChange={e => setPatientAddress(e.target.value)}
          className="border p-2 w-full"
        />
        <input 
          type="text" placeholder="Medication" 
          value={medication}
          onChange={e => setMedication(e.target.value)}
          className="border p-2 w-full"
        />
        <button 
          onClick={handleCreatePrescription}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Prescribe
        </button>
      </div>
    )}

    {account && role === "Pharmacist" && (
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold">Pharmacist Dashboard</h3>
        <input 
          type="text" placeholder="Prescription ID" 
          value={patientAddress}
          onChange={e => setPatientAddress(e.target.value)}
          className="border p-2 w-full"
        />
        <button 
          onClick={handleDispense}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
        >
          Dispense
        </button>
      </div>
    )}

    {account && role === "Insurance" && (
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold">Insurance Dashboard</h3>
        <input 
          type="text" placeholder="Prescription ID" 
          value={patientAddress}
          onChange={e => setPatientAddress(e.target.value)}
          className="border p-2 w-full"
        />
        <button 
          onClick={handleApprove}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          Approve
        </button>
      </div>
    )}
  </div>
);
}

export default App;
