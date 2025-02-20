//This script deploys Implementation(LPMigration) contract & Proxy contract.
//Then it upgrades the proxy to implementation address and initializes the implementation via Proxy.
const { ethers , run} = require("hardhat");
async function main() {

  lpMigration = await (await ethers.getContractFactory("MyToken")).deploy();

  console.log("Implementation address:", lpMigration.target);

  const proxy = await (
    await ethers.getContractFactory("OwnedUpgradeabilityProxy")
  ).deploy();
  console.log("proxy address:", proxy.target);

  await proxy.upgradeTo(lpMigration.target); //For Ethereum
  lpmViaProxy = await lpMigration.attach(proxy.target);
  await lpmViaProxy.initialize("0x4A4E870F13f3F3568B2A1f392BC2735a25947E8F","0x4A4E870F13f3F3568B2A1f392BC2735a25947E8F","Shivam","SV"); //For Ethereum
}

main();