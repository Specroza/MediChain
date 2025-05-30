// src/App.js
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
    <div style={{ padding: 20 }}>
      {!account && 
        <button onClick={connectWallet}>Connect MetaMask</button>}
      {account && !role && (
        <div>
          <h2>Welcome, {account}</h2>
          <label>Select Role: </label>
          <select onChange={handleRoleChange}>
            <option value="">-- Choose --</option>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Insurance">Insurance</option>
          </select>
        </div>
      )}
      {account && role === "Patient" && (
        <div>
          <h3>Patient Dashboard</h3>
          <p>Register as Patient (on-chain):</p>
          <button onClick={async () => {
            await contract.registerAsPatient();
            alert("Registered as patient");
          }}>Register</button>
          <p>Upload Medical Record:</p>
          <input type="file" accept="application/pdf" onChange={handleUploadRecord} />
          <p>Grant Doctor Access:</p>
          <input type="text" placeholder="Doctor Address" value={patientAddress}
                 onChange={e => setPatientAddress(e.target.value)} />
          <button onClick={handleGrantDoctor}>Grant</button>
        </div>
      )}
      {account && role === "Doctor" && (
        <div>
          <h3>Doctor Dashboard</h3>
          <p>Create Prescription for Patient:</p>
          <input type="text" placeholder="Patient Address" value={patientAddress}
                 onChange={e => setPatientAddress(e.target.value)} />
          <input type="text" placeholder="Medication" value={medication}
                 onChange={e => setMedication(e.target.value)} />
          <button onClick={handleCreatePrescription}>Prescribe</button>
        </div>
      )}
      {account && role === "Pharmacist" && (
        <div>
          <h3>Pharmacist Dashboard</h3>
          <p>Mark Prescription as Dispensed (enter ID):</p>
          <input type="text" placeholder="Prescription ID" value={patientAddress}
                 onChange={e => setPatientAddress(e.target.value)} />
          <button onClick={handleDispense}>Dispense</button>
        </div>
      )}
      {account && role === "Insurance" && (
        <div>
          <h3>Insurance Dashboard</h3>
          <p>Approve Claim (enter Prescription ID):</p>
          <input type="text" placeholder="Prescription ID" value={patientAddress}
                 onChange={e => setPatientAddress(e.target.value)} />
          <button onClick={handleApprove}>Approve</button>
        </div>
      )}
    </div>
  );
}

export default App;
