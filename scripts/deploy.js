// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const Healthcare = await ethers.getContractFactory("Healthcare");
  const healthcare = await Healthcare.deploy();
  await healthcare.deployed();

  console.log("Healthcare contract deployed to:", healthcare.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
