const { ethers, upgrades } = require("hardhat");
const os = require('os');
const { performance } = require('perf_hooks');

const NUM_TRANSACTIONS = 500; // Adjust based on testing needs

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying contract...");

    const MyToken = await ethers.getContractFactory("MyToken");

    try {
        // Deploy contract as an upgradeable proxy
        const contract = await upgrades.deployProxy(MyToken, [deployer.address, deployer.address, "MyToken", "MTK"], { initializer: "initialize" });
        await contract.waitForDeployment();
        console.log(`✅ Contract deployed at: ${contract.target}`);

        // Check roles
        const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
        const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANAGER"));

        console.log(`🔑 Checking if deployer has admin role...`);
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);

        if (!hasAdminRole) {
            console.error("❌ Deployer is not an admin. Check contract setup.");
            return;
        }

        console.log(`✅ Deployer is admin. Granting MANAGER_ROLE...`);
        let tx = await contract.grantRole(MANAGER_ROLE, deployer.address);
        await tx.wait();
        console.log("✅ MANAGER_ROLE granted!");

        // 🚀 Perform performance test with multiple mint calls
        await performanceTest(contract, deployer);

    } catch (error) {
        console.error("❌ Deployment or setup failed:", error);
    }
}

async function performanceTest(contract, deployer) {
    console.log("\n🔄 Starting Performance Test...");

    // System resource monitoring before test
    const startCPU = os.loadavg();
    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    let successCount = 0;
    let failCount = 0;
    let transactions = [];

    console.log(`🛠️ Creating a new token before minting...`);
    let createTx = await contract.create(deployer.address, 100, "token1.json", "0x");
    await createTx.wait();
    console.log(`✅ Token Created!`);

    console.log(`\n🚀 Minting ${NUM_TRANSACTIONS} times...`);
    
    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
        try {
            let tx = await contract.mint(deployer.address, 1, 1, "0x"); // Minting 1 token each time
            transactions.push(tx.wait()); // Push promise to wait for confirmation
        } catch (error) {
            console.error(`❌ Mint Transaction ${i + 1} failed:`, error);
            failCount++;
        }
    }

    console.log(`⌛ Waiting for transactions to confirm...`);
    const submitStartTime = performance.now();
    const results = await Promise.allSettled(transactions);
    const submitEndTime = performance.now();

    // Analyze results
    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            successCount++;
        } else {
            console.error(`❌ Transaction ${index + 1} failed:`, result.reason);
            failCount++;
        }
    });

    // System resource monitoring after test
    const endCPU = os.loadavg();
    const endMem = process.memoryUsage().heapUsed;

    const totalTime = (submitEndTime - submitStartTime) / 1000;
    const avgTxTime = totalTime / NUM_TRANSACTIONS;
    const tps = successCount / totalTime;

    console.log("\n=== 🏆 Performance Test Summary ===");
    console.log(`✅ Total Transactions: ${NUM_TRANSACTIONS}`);
    console.log(`✅ Successful Transactions: ${successCount}`);
    console.log(`❌ Failed Transactions: ${failCount}`);
    console.log(`⏳ Total Time: ${totalTime.toFixed(2)} sec`);
    console.log(`⚡ Average Transaction Time: ${(avgTxTime * 1000).toFixed(2)} ms`);
    console.log(`🚀 Transactions Per Second (TPS): ${tps.toFixed(2)}`);
    console.log(`🖥 CPU Load Before: ${startCPU[0].toFixed(2)}, After: ${endCPU[0].toFixed(2)}`);
    console.log(`📦 Memory Usage Before: ${(startMem / 1024 / 1024).toFixed(2)} MB, After: ${(endMem / 1024 / 1024).toFixed(2)} MB`);

    console.log("\n🎉 Performance test completed!");
}

main().catch(console.error);
