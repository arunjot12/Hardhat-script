const { ethers } = require("hardhat");

async function main() {
    const proxy = "0x248e9889986E13f4fD8A5852122C80C75e744E99";
    const mytoken = await ethers.getContractFactory("MyToken");
    const contract = await mytoken.attach(proxy);
    console.log("Available methods on the contract:");
    contract.interface.fragments.forEach(fragment => {
        if (fragment.type === "function") {
        console.log(`${fragment.name}(${fragment.inputs.map(input => input.type).join(", ")})`);
        }
    });
    //minting the tokens
    mint = async (account,id,supply,data) => {
        await contract.mint(account,id,supply,data);
    }

    // creating some nfts
    create = async (account,id,uri,data) => {
        await contract.create(account,id,uri,data);
    }

    //checking the totalsupply
    totalsupply = async (tokenId) => {
        const val = await contract['totalSupply(uint256)'](tokenId);
        console.log(val);
    };
    // await totalsupply(3);

    //get the byte of the role
    burner = async () => {
        const bytes = await contract.BURNER();
        console.log(bytes);
    }

    //get the byte of the role
    manager = async () => {
        const bytes = await contract.MANAGER();
        console.log(bytes);
    }

    //get the uri of the token.
    uri = async (tokenId) => {
        const uri = await contract['uri(uint256)'](tokenId);
        console.log(uri);
    };
    await uri(1);

    //update the uri of the given tokenId.
    updateUri = async (tokenId,uri) => {
        await contract['updateUri(uint256,string)'](tokenId,uri);
    }

    //burning the token
    burn = async (account,id,value) => {
        await contract.burn(account,id,value);
    }
    
    //mintBatch
    mintBatch = async (to,ids,amounts,data) => {
        await contract.mintBatch(to,ids,amounts,data);
    }
    // await mintBatch("0x4A4E870F13f3F3568B2A1f392BC2735a25947E8F",[1,2,3],[777,777,777],"0xacca");

    //balance of a perticular account with specified account id
    balanceOf = async (account,id) => {
        const res = await contract.balanceOf(account,id);
        console.log(res);
    }
    // await balanceOf("0x4A4E870F13f3F3568B2A1f392BC2735a25947E8F",1);
    // await contract.proxy.upgradeTo("0x248e9889986E13f4fD8A5852122C80C75e744E99");
}

main().then(()=>process.exit(0)).catch((e)=>{console.log(e);process.exit(1);});