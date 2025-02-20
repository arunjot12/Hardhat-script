// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyToken is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, ERC1155BurnableUpgradeable, ERC1155SupplyUpgradeable {
    //@notice all the roles that will be there 
    
    bytes32 public constant MANAGER = keccak256("MANAGER");

    string private name;
    string private symbol;
    uint256 private next_id;
    string private base_uri;
    mapping(uint256 => string ) private token_uri;

    // / @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin, address manager,string memory _name,string memory _symbol) initializer public {
        __ERC1155_init("https://ipfsget.pstuff.net/ipfs/");
        __AccessControl_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        name = _name;
        symbol = _symbol;
        base_uri = "https://ipfsget.pstuff.net/ipfs/";
        next_id = 0;
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MANAGER, manager);
    }

    function setURI(string memory newuri) public onlyRole(MANAGER) {
        _setURI(newuri);
        base_uri = newuri;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return (tokenId > 0 && tokenId <= next_id);
    }

    function uri(uint256 tokenId) public override(ERC1155Upgradeable) view returns(string memory) {
        require(_exists(tokenId), "ERC1155Metadata: URI query for nonexistent token");

        string memory _tokenURI = token_uri[tokenId];
        string memory base = base_uri;

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        return string(abi.encodePacked(base, _tokenURI));
    }

    function updateUri(uint256 tokenId,string memory newuri) public onlyRole(MANAGER) {
        require(_exists(tokenId), "ERC1155Metadata: updateUri query for nonexistent token");
        token_uri[tokenId] = newuri;
    }

    function create(address account,uint256 amount,string memory _uri,bytes memory data) public onlyRole(MANAGER) {
        next_id++;
        token_uri[next_id] = _uri;
        _mint(account, next_id,amount,data);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MANAGER) {
        require(_exists(id),"ERC1155Metadata: mint query for nonexistent token");
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MANAGER) {
        for(uint256 i = 0 ; i < ids.length ; i++) {
            require(_exists(ids[i]),"ERC1155Metadata: mint query for nonexistent token");
        }
        _mintBatch(to, ids, amounts, data);
    }

    function burn(address account,uint256 id,uint256 value) public override(ERC1155BurnableUpgradeable) {
        require(_exists(id),"ERC1155Metadata: burn query for nonexistent token");
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );

        _burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public override(ERC1155BurnableUpgradeable) {
        for(uint256 i = 0 ; i < ids.length ; i++) {
            require(_exists(ids[i]),"ERC1155Metadata: burn query for nonexistent token");
        }

        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );

        _burnBatch(account, ids, values);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
