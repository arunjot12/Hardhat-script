const { ethers } = require("hardhat");
const os = require('os');
const { performance } = require('perf_hooks');

const RPC_URL = "http://127.0.0.1:9944"; // Update with your Ethereum node
const PRIVATE_KEY = "d04eed5731e19c5dd8d79c507d15a50119d2f9b23efb9da986ff53e5dbe20d8e"; // Sender's private key
const RECEIVER = "0x56bB7B104E263164871a55dD5f489A87Dc3E4D38"; // Receiver's address
const NUM_TRANSACTIONS = 100000; // Total transactions
const BATCH_SIZE = 1000; // Limit batch size to avoid mempool flooding
const TRANSFER_AMOUNT = ethers.parseEther("0.01");

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
    
    let nonce = await provider.getTransactionCount(wallet.address, "latest");
    console.log(`Current nonce: ${nonce}`);

    console.log(`Sending ${NUM_TRANSACTIONS} transactions in batches of ${BATCH_SIZE}...`);

    for (let batch = 0; batch < NUM_TRANSACTIONS / BATCH_SIZE; batch++) {
        let transactions = [];

        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas * BigInt(12) / BigInt(10);
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * BigInt(12) / BigInt(10);

        for (let i = 0; i < BATCH_SIZE; i++) {
            const tx = {
                to: RECEIVER,
                value: TRANSFER_AMOUNT,
                nonce: nonce++, 
                gasLimit: 21000,
                maxFeePerGas,
                maxPriorityFeePerGas
            };

            // Send transaction and wait for confirmation
            transactions.push(wallet.sendTransaction(tx).then(tx => tx.wait(1)));
        }

        console.log(`Waiting for batch ${batch + 1} to confirm...`);
        const results = await Promise.allSettled(transactions);

        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                successCount++;
            } else {
                failCount++;
                console.error(`❌ Transaction ${batch * BATCH_SIZE + index + 1} failed:`, result.reason);
            }
        });

        console.log(`✅ Batch ${batch + 1} complete. Success: ${successCount}, Fail: ${failCount}`);

        // Small delay to prevent overloading the node
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const endCPU = os.loadavg();
    const endMem = process.memoryUsage().heapUsed;
    const totalTime = (performance.now() - startTime) / 1000;
    const avgTxTime = totalTime / successCount;
    const tps = successCount / totalTime;

    console.log("\n=== Performance Test Summary ===");
    console.log(`Total Transactions Attempted: ${NUM_TRANSACTIONS}`);
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
