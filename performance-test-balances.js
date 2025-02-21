const { ethers } = require("hardhat");
const os = require('os');
const { performance } = require('perf_hooks');

const RPC_URL = "http://127.0.0.1:9944"; // Update with your Ethereum node
const PRIVATE_KEY = "d04eed5731e19c5dd8d79c507d15a50119d2f9b23efb9da986ff53e5dbe20d8e"; // Sender's private key from MetaMask
const RECEIVER = "0x56bB7B104E263164871a55dD5f489A87Dc3E4D38"; // Receiver's MetaMask address
const NUM_TRANSACTIONS = 900; // Adjust based on testing needs
const TRANSFER_AMOUNT = ethers.parseEther("0.01"); // Sending 0.01 ETH per tx

async function main() {
    console.log("Connecting to Ethereum node...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`Using sender account: ${wallet.address}`);

    console.log("Starting resource monitoring...");
    const startCPU = os.loadavg();
    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    let successCount = 0;
    let failCount = 0;
    let transactions = [];

    // Fetch nonce
    let nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce: ${nonce}`);

    console.log(`Signing and sending ${NUM_TRANSACTIONS} transactions...`);
    
    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
        const tx = {
            to: RECEIVER,
            value: TRANSFER_AMOUNT,
            nonce: nonce + i,
            gasLimit: 21000, // Standard gas for ETH transfers
            gasPrice: await provider.getFeeData().then(fee => fee.gasPrice)
        };

        // Sign and send transaction
        transactions.push(wallet.sendTransaction(tx));
    }

    console.log(`Waiting for ${NUM_TRANSACTIONS} transactions to confirm...`);
    const submitStartTime = performance.now();

    const results = await Promise.allSettled(transactions);

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