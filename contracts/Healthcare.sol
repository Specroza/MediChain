// contracts/Healthcare.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
  Healthcare Management Contract
  - Manages roles (Patient, Doctor, Pharmacist, Insurance)
  - Stores prescriptions and access permissions on-chain
*/

contract Healthcare {
    // Define user roles
    enum Role { None, Patient, Doctor, Pharmacist, Insurance }
    // Prescription status and claim status enums
    enum PresStatus { Pending, Dispensed }
    enum ClaimStatus { None, Pending, Approved, Rejected }

    // Prescription structure
    struct Prescription {
        uint id;
        address patient;
        address doctor;
        string medication;
        uint timestamp;
        PresStatus status;
        ClaimStatus claim;
    }

    // Mapping of user address to Role
    mapping(address => Role) public roles;
    // Mapping of patient address to list of IPFS CIDs (their medical records)
    mapping(address => string[]) public medicalRecords;
    // Access control: patient => (accessor => allowed)
    mapping(address => mapping(address => bool)) public accessGranted;
    // Reverse mappings for listing granted patients
    mapping(address => address[]) public doctorPatients;
    mapping(address => address[]) public patientDoctors;
    mapping(address => address[]) public patientPharmacists;
    mapping(address => address[]) public patientInsurers;

    // Prescription storage
    mapping(uint => Prescription) public prescriptions;
    uint public prescriptionCount;
    mapping(address => uint[]) public patientPrescriptions;

    // Events
    event Registered(address indexed user, Role role);
    event AccessChanged(address indexed patient, address indexed accessor, Role accessorRole, bool granted);
    event PrescriptionCreated(uint indexed id, address patient, address doctor);
    event PrescriptionDispensed(uint indexed id, address pharmacist);
    event ClaimSubmitted(uint indexed id, address pharmacist);
    event ClaimApproved(uint indexed id, address insurance);
    event ClaimRejected(uint indexed id, address insurance);
    event MedicalRecordAdded(address indexed patient, string cid);

    // Modifier to check sender role
    modifier onlyRole(Role r) {
        require(roles[msg.sender] == r, "Not authorized");
        _;
    }

    // ===== Registration functions =====
    function registerAsPatient() external {
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = Role.Patient;
        emit Registered(msg.sender, Role.Patient);
    }
    function registerAsDoctor() external {
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = Role.Doctor;
        emit Registered(msg.sender, Role.Doctor);
    }
    function registerAsPharmacist() external {
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = Role.Pharmacist;
        emit Registered(msg.sender, Role.Pharmacist);
    }
    function registerAsInsurance() external {
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = Role.Insurance;
        emit Registered(msg.sender, Role.Insurance);
    }

    // ===== Access control =====
    // Patient grants access to a doctor
    function grantDoctorAccess(address _doctor) external onlyRole(Role.Patient) {
        require(roles[_doctor] == Role.Doctor, "Not a doctor");
        accessGranted[msg.sender][_doctor] = true;
        doctorPatients[_doctor].push(msg.sender);
        patientDoctors[msg.sender].push(_doctor);
        emit AccessChanged(msg.sender, _doctor, Role.Doctor, true);
    }
    // Patient revokes access from a doctor
    function revokeDoctorAccess(address _doctor) external onlyRole(Role.Patient) {
        accessGranted[msg.sender][_doctor] = false;
        emit AccessChanged(msg.sender, _doctor, Role.Doctor, false);
    }
    // Similarly for pharmacist access
    function grantPharmacistAccess(address _pharma) external onlyRole(Role.Patient) {
        require(roles[_pharma] == Role.Pharmacist, "Not a pharmacist");
        accessGranted[msg.sender][_pharma] = true;
        patientPharmacists[msg.sender].push(_pharma);
        emit AccessChanged(msg.sender, _pharma, Role.Pharmacist, true);
    }
    function revokePharmacistAccess(address _pharma) external onlyRole(Role.Patient) {
        accessGranted[msg.sender][_pharma] = false;
        emit AccessChanged(msg.sender, _pharma, Role.Pharmacist, false);
    }
    // Grant/revoke for insurance
    function grantInsuranceAccess(address _ins) external onlyRole(Role.Patient) {
        require(roles[_ins] == Role.Insurance, "Not an insurer");
        accessGranted[msg.sender][_ins] = true;
        patientInsurers[msg.sender].push(_ins);
        emit AccessChanged(msg.sender, _ins, Role.Insurance, true);
    }
    function revokeInsuranceAccess(address _ins) external onlyRole(Role.Patient) {
        accessGranted[msg.sender][_ins] = false;
        emit AccessChanged(msg.sender, _ins, Role.Insurance, false);
    }

    // ===== Medical records =====
    // Patient uploads a medical record CID (after uploading PDF to IPFS off-chain)
    function addMedicalRecord(string calldata _cid) external onlyRole(Role.Patient) {
        medicalRecords[msg.sender].push(_cid);
        emit MedicalRecordAdded(msg.sender, _cid);
    }
    // View records (patient or granted)
    function getMedicalRecords(address _patient) external view returns (string[] memory) {
        require(
            msg.sender == _patient || accessGranted[_patient][msg.sender],
            "Access denied"
        );
        return medicalRecords[_patient];
    }

    // ===== Prescription functions =====
    function createPrescription(address _patient, string calldata _med) external onlyRole(Role.Doctor) {
        require(accessGranted[_patient][msg.sender], "Doctor not approved by patient");
        prescriptionCount++;
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            patient: _patient,
            doctor: msg.sender,
            medication: _med,
            timestamp: block.timestamp,
            status: PresStatus.Pending,
            claim: ClaimStatus.None
        });
        patientPrescriptions[_patient].push(prescriptionCount);
        emit PrescriptionCreated(prescriptionCount, _patient, msg.sender);
    }
    // Pharmacist marks prescription as dispensed
    function markAsDispensed(uint _id) external onlyRole(Role.Pharmacist) {
        Prescription storage p = prescriptions[_id];
        require(p.status == PresStatus.Pending, "Already dispensed");
        require(accessGranted[p.patient][msg.sender], "Pharmacist not approved by patient");
        p.status = PresStatus.Dispensed;
        emit PrescriptionDispensed(_id, msg.sender);
    }
    // Pharmacist submits an insurance claim for a prescription
    function submitClaim(uint _id) external onlyRole(Role.Pharmacist) {
        Prescription storage p = prescriptions[_id];
        require(p.status == PresStatus.Dispensed, "Not dispensed yet");
        require(p.claim == ClaimStatus.None, "Claim already submitted");
        p.claim = ClaimStatus.Pending;
        emit ClaimSubmitted(_id, msg.sender);
    }
    // Insurance approves or rejects claim
    function approveClaim(uint _id) external onlyRole(Role.Insurance) {
        Prescription storage p = prescriptions[_id];
        require(p.claim == ClaimStatus.Pending, "No pending claim");
        require(accessGranted[p.patient][msg.sender], "Insurer not approved by patient");
        p.claim = ClaimStatus.Approved;
        emit ClaimApproved(_id, msg.sender);
    }
    function rejectClaim(uint _id) external onlyRole(Role.Insurance) {
        Prescription storage p = prescriptions[_id];
        require(p.claim == ClaimStatus.Pending, "No pending claim");
        require(accessGranted[p.patient][msg.sender], "Insurer not approved by patient");
        p.claim = ClaimStatus.Rejected;
        emit ClaimRejected(_id, msg.sender);
    }

    // ===== View functions =====
    // For doctor to list their patients who granted access
    function getMyPatients() external view onlyRole(Role.Doctor) returns (address[] memory) {
        return doctorPatients[msg.sender];
    }
    // For pharmacist to list patients (similar pattern could be added)
    function getPatientPrescriptions(address _patient) external view onlyRole(Role.Pharmacist) returns (uint[] memory) {
        require(accessGranted[_patient][msg.sender], "Access denied");
        return patientPrescriptions[_patient];
    }
    // Get prescription details by ID
    function getPrescription(uint _id) external view returns (
        uint, address, address, string memory, uint, PresStatus, ClaimStatus
    ) {
        Prescription storage p = prescriptions[_id];
        return (p.id, p.patient, p.doctor, p.medication, p.timestamp, p.status, p.claim);
    }
}
