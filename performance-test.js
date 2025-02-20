const { ethers } = require("hardhat");
const os = require('os');
const { performance } = require('perf_hooks');

const RPC_URL = "http://127.0.0.1:9944"; // Update to your Ethereum node RPC
const PRIVATE_KEY = "d04eed5731e19c5dd8d79c507d15a50119d2f9b23efb9da986ff53e5dbe20d8e";  // Use a funded private key for testing
const CONTRACT_ADDRESS = "0x248e9889986E13f4fD8A5852122C80C75e744E99"; // Proxy address
const RECEIVER = "0x43F3c74EBe6A640785306535C05AAd7e5AdA1673"; // Recipient
const NUM_TRANSACTIONS = 100; // Adjust as needed
const TRANSFER_AMOUNT = ethers.parseUnits("1", 18); // 1 token

async function main() {
    console.log("Connecting to Ethereum node...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`Using sender account: ${wallet.address}`);

    const contract = await ethers.getContractAt("MyToken", CONTRACT_ADDRESS, wallet);
    
    console.log("Starting resource monitoring...");
    const startCPU = os.loadavg();
    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    let successCount = 0;
    let failCount = 0;
    let signedTxs = [];

    // Fetch nonce
    let nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce: ${nonce}`);

    console.log(`Signing ${NUM_TRANSACTIONS} transactions...`);
    
    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
        const tx = await contract.mint(RECEIVER, i, TRANSFER_AMOUNT, "0x", {
            nonce: nonce + i, // Unique nonce per transaction
            gasLimit: ethers.parseUnits("100000", "wei"), // Adjust gas limit
            gasPrice: await provider.getFeeData().then(fee => fee.gasPrice * BigInt(12) / BigInt(10))

        });
    
        signedTxs.push(tx.wait());
    }
    console.log(`Sending ${NUM_TRANSACTIONS} transactions...`);
    const submitStartTime = performance.now();

    const results = await Promise.allSettled(signedTxs);

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(`Transaction ${index + 1} succeeded.`);
            successCount++;
        } else {
            console.error(`Transaction ${index + 1} failed:`, result.reason);
            failCount++;
        }
    });

    const submitEndTime = performance.now();
    const endCPU = os.loadavg();
    const endMem = process.memoryUsage().heapUsed;

    const totalTime = (submitEndTime - submitStartTime) / 1000;
    const avgTxTime = totalTime / NUM_TRANSACTIONS;
    const tps = successCount / totalTime;

    console.log("\n=== Performance Test Summary ===");
    console.log(`Total Transactions: ${NUM_TRANSACTIONS}`);
    console.log(`Successful Transactions: ${successCount}`);
    console.log(`Failed Transactions: ${failCount}`);
    console.log(`Total Time: ${totalTime.toFixed(2)} sec`);
    console.log(`Average Transaction Time: ${(avgTxTime * 1000).toFixed(2)} ms`);
    console.log(`Transactions Per Second (TPS): ${tps.toFixed(2)}`);
    console.log(`CPU Load Before: ${startCPU[0].toFixed(2)}, After: ${endCPU[0].toFixed(2)}`);
    console.log(`Memory Usage Before: ${(startMem / 1024 / 1024).toFixed(2)} MB, After: ${(endMem / 1024 / 1024).toFixed(2)} MB`);

    process.exit();
}

main().catch(console.error);
