// test/Box.test.js
// Load dependencies
const { expect } = require('chai');

// Start test block
describe('ERC1155', function () {
  before(async function () {
    this.proxy = "0x248e9889986E13f4fD8A5852122C80C75e744E99";
    this.mytoken = await ethers.getContractFactory("MyToken");
  });

  beforeEach(async function () {
    
  });

  // Test case
  it('getting the total supply', async function () {
    await this.box.create("0x4A4E870F13f3F3568B2A1f392BC2735a25947E8F",11,"abc","0xaa");
    const tokenId = 1;
    expect((await this.box['totalSupply(uint256)'](tokenId)).toString().to.equal('11'));
  });
});