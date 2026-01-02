// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CosmoNFT
 * @dev ERC-721 NFT contract with dynamic pricing and tier management
 * Deployed on Polygon PoS
 */
contract CosmoNFT is ERC721, ERC721Enumerable, ERC721Royalty, Ownable {

    // Tier structure for dynamic pricing
    struct Tier {
        uint256 price;              // Price in USD (18 decimals)
        uint256 quantityAvailable;  // NFTs in this tier
        uint256 quantitySold;       // Already sold
        uint256 startTime;          // When tier starts
        uint256 duration;           // How long it lasts
        bool active;
    }

    Tier[] public tiers;
    uint256 public currentTierIndex = 0;
    uint256 public totalNFTsMinted = 0;
    uint256 public constant MAX_SUPPLY = 20000;

    // Royalty: 25% to creators/TPS
    uint256 public constant ROYALTY_PERCENTAGE = 2500;
    address public tpsAddress;

    // 7.5% price increase per phase
    uint256 public constant PRICE_INCREASE_BPS = 750; // basis points

    // Base URI for metadata
    string private _baseTokenURI;

    // Auction structure for high-profile objects
    struct Auction {
        uint256 tokenId;
        uint256 startingBid;
        uint256 currentBid;
        address highestBidder;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool finalized;
    }

    mapping(uint256 => Auction) public auctions;
    uint256[] public activeAuctionIds;

    // Minimum bid increment: 5%
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;

    // Events
    event TierAdvanced(uint256 indexed tierIndex, uint256 newPrice);
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 price);
    event RoyaltiesWithdrawn(address indexed to, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event AuctionCreated(uint256 indexed tokenId, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 bidAmount);
    event AuctionFinalized(uint256 indexed tokenId, address indexed winner, uint256 finalPrice);

    constructor(address _tpsAddress) ERC721("CosmoNFT", "COSMO") Ownable(msg.sender) {
        require(_tpsAddress != address(0), "Invalid TPS address");
        tpsAddress = _tpsAddress;

        // Initialize pricing tiers
        initializeTiers();

        // Set royalty standard (ERC-2981)
        _setDefaultRoyalty(address(this), uint96(ROYALTY_PERCENTAGE));
    }

    /**
     * @dev Initialize 81 pricing tiers
     * Phase 1: 1,000 NFTs @ base price (4 weeks)
     * Phases 2-81: 250 NFTs @ +7.5% each week
     */
    function initializeTiers() internal {
        // Phase 1 (4 weeks, 1,000 NFTs)
        uint256 basePrice = 350 * 10**18; // $350

        tiers.push(Tier({
            price: basePrice,
            quantityAvailable: 1000,
            quantitySold: 0,
            startTime: block.timestamp,
            duration: 28 days,
            active: true
        }));

        // Phases 2-81 (1 week each, 250 NFTs, 7.5% increase)
        for (uint256 i = 1; i <= 80; i++) {
            // Calculate price: base * (1.075^i)
            uint256 price = calculatePrice(basePrice, i);

            tiers.push(Tier({
                price: price,
                quantityAvailable: 250,
                quantitySold: 0,
                startTime: block.timestamp + 28 days + ((i - 1) * 7 days),
                duration: 7 days,
                active: false
            }));
        }
    }

    /**
     * @dev Calculate price with 7.5% compound increase
     */
    function calculatePrice(uint256 basePrice, uint256 phases)
        internal
        pure
        returns (uint256)
    {
        // price = base * (1.075^phases)
        // Using fixed point: (base * (1075^phases)) / (1000^phases)
        uint256 result = basePrice;
        for (uint256 i = 0; i < phases; i++) {
            result = (result * 1075) / 1000;
        }
        return result;
    }

    /**
     * @dev Get current active tier
     */
    function getCurrentTier() public view returns (uint256, Tier memory) {
        for (uint256 i = 0; i < tiers.length; i++) {
            Tier memory tier = tiers[i];

            // Check if time-active
            if (block.timestamp >= tier.startTime &&
                block.timestamp < tier.startTime + tier.duration) {
                return (i, tier);
            }

            // Skip sold-out tiers
            if (tier.quantityAvailable > 0 &&
                tier.quantitySold >= tier.quantityAvailable) {
                continue;
            }
        }

        // Return last tier
        uint256 lastIndex = tiers.length - 1;
        return (lastIndex, tiers[lastIndex]);
    }

    /**
     * @dev Get current price
     */
    function getCurrentPrice() external view returns (uint256) {
        (, Tier memory tier) = getCurrentTier();
        return tier.price;
    }

    /**
     * @dev Get time until next tier (in seconds)
     */
    function getTimeUntilNextTier() external view returns (uint256) {
        (, Tier memory currentTier) = getCurrentTier();

        uint256 tierEndTime = currentTier.startTime + currentTier.duration;

        if (block.timestamp >= tierEndTime) {
            return 0;
        }

        return tierEndTime - block.timestamp;
    }

    /**
     * @dev Get quantity remaining at current price
     */
    function getQuantityRemaining() external view returns (uint256) {
        (, Tier memory tier) = getCurrentTier();

        if (tier.quantityAvailable == 0) {
            return type(uint256).max; // Unlimited
        }

        return tier.quantityAvailable - tier.quantitySold;
    }

    /**
     * @dev Mint NFT (called by backend after payment verified)
     * Only owner (backend) can call
     */
    function mint(address to, uint256 tokenId) external onlyOwner returns (bool) {
        require(totalNFTsMinted < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Invalid address");

        (uint256 tierIdx, Tier memory tier) = getCurrentTier();

        // Check availability
        if (tier.quantityAvailable > 0) {
            require(
                tier.quantitySold < tier.quantityAvailable,
                "Tier sold out"
            );
        }

        // Mint
        _safeMint(to, tokenId);

        // Update tier
        tiers[tierIdx].quantitySold++;
        totalNFTsMinted++;

        emit NFTMinted(to, tokenId, tier.price);
        return true;
    }

    /**
     * @dev Batch mint multiple NFTs
     */
    function batchMint(address to, uint256[] calldata tokenIds) external onlyOwner returns (bool) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(totalNFTsMinted < MAX_SUPPLY, "Max supply reached");

            (uint256 tierIdx, Tier memory tier) = getCurrentTier();

            if (tier.quantityAvailable > 0) {
                require(tier.quantitySold < tier.quantityAvailable, "Tier sold out");
            }

            _safeMint(to, tokenIds[i]);
            tiers[tierIdx].quantitySold++;
            totalNFTsMinted++;

            emit NFTMinted(to, tokenIds[i], tier.price);
        }
        return true;
    }

    /**
     * @dev Advance to next tier (called by backend cron)
     */
    function advanceTier() external onlyOwner {
        require(currentTierIndex < tiers.length - 1, "Already at final tier");

        currentTierIndex++;
        Tier memory newTier = tiers[currentTierIndex];

        emit TierAdvanced(currentTierIndex, newTier.price);
    }

    /**
     * @dev Withdraw royalties (70% owner, 30% TPS)
     */
    function withdrawRoyalties() external {
        uint256 balance = address(this).balance;
        require(balance > 0, "No royalties");

        uint256 ownerShare = (balance * 70) / 100;
        uint256 tpsShare = balance - ownerShare;

        (bool success1, ) = owner().call{value: ownerShare}("");
        require(success1, "Owner withdrawal failed");

        (bool success2, ) = tpsAddress.call{value: tpsShare}("");
        require(success2, "TPS withdrawal failed");

        emit RoyaltiesWithdrawn(owner(), ownerShare);
    }

    // ============ AUCTION FUNCTIONS ============

    /**
     * @dev Create auction for high-profile object (called by backend)
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingBid,
        uint256 durationDays
    ) external onlyOwner {
        require(!auctions[tokenId].active, "Auction already exists");
        require(durationDays > 0 && durationDays <= 30, "Invalid duration");

        uint256 endTime = block.timestamp + (durationDays * 1 days);

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            startingBid: startingBid,
            currentBid: startingBid,
            highestBidder: address(0),
            startTime: block.timestamp,
            endTime: endTime,
            active: true,
            finalized: false
        });

        activeAuctionIds.push(tokenId);

        emit AuctionCreated(tokenId, startingBid, endTime);
    }

    /**
     * @dev Place bid in auction (called by backend after payment hold)
     */
    function placeBid(uint256 tokenId, address bidder, uint256 bidAmount) external onlyOwner {
        Auction storage auction = auctions[tokenId];

        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(bidder != address(0), "Invalid bidder");

        // Minimum bid: current + 5%
        uint256 minBid = auction.currentBid + ((auction.currentBid * MIN_BID_INCREMENT_BPS) / 10000);
        require(bidAmount >= minBid, "Bid too low");

        auction.currentBid = bidAmount;
        auction.highestBidder = bidder;

        emit BidPlaced(tokenId, bidder, bidAmount);
    }

    /**
     * @dev Finalize auction and mint to winner (called by backend after payment)
     */
    function finalizeAuction(uint256 tokenId) external onlyOwner {
        Auction storage auction = auctions[tokenId];

        require(auction.active, "Auction not active");
        require(block.timestamp > auction.endTime, "Auction still active");
        require(!auction.finalized, "Already finalized");
        require(auction.highestBidder != address(0), "No bids placed");

        // Mint NFT to winner
        _safeMint(auction.highestBidder, tokenId);
        totalNFTsMinted++;

        // Mark as finalized
        auction.active = false;
        auction.finalized = true;

        // Remove from active auctions
        _removeActiveAuction(tokenId);

        emit AuctionFinalized(tokenId, auction.highestBidder, auction.currentBid);
    }

    /**
     * @dev Cancel auction (emergency only)
     */
    function cancelAuction(uint256 tokenId) external onlyOwner {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");

        auction.active = false;
        _removeActiveAuction(tokenId);
    }

    /**
     * @dev Get auction details
     */
    function getAuction(uint256 tokenId) external view returns (Auction memory) {
        return auctions[tokenId];
    }

    /**
     * @dev Get all active auction IDs
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        return activeAuctionIds;
    }

    /**
     * @dev Check if auction has ended
     */
    function isAuctionEnded(uint256 tokenId) external view returns (bool) {
        Auction memory auction = auctions[tokenId];
        return block.timestamp > auction.endTime;
    }

    /**
     * @dev Get time remaining in auction
     */
    function getAuctionTimeRemaining(uint256 tokenId) external view returns (uint256) {
        Auction memory auction = auctions[tokenId];
        if (block.timestamp >= auction.endTime) {
            return 0;
        }
        return auction.endTime - block.timestamp;
    }

    /**
     * @dev Remove auction from active list
     */
    function _removeActiveAuction(uint256 tokenId) internal {
        for (uint256 i = 0; i < activeAuctionIds.length; i++) {
            if (activeAuctionIds[i] == tokenId) {
                activeAuctionIds[i] = activeAuctionIds[activeAuctionIds.length - 1];
                activeAuctionIds.pop();
                break;
            }
        }
    }

    // ============ END AUCTION FUNCTIONS ============

    /**
     * @dev Set base URI for token metadata
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    /**
     * @dev Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get tier count
     */
    function getTierCount() external view returns (uint256) {
        return tiers.length;
    }

    /**
     * @dev Get tier by index
     */
    function getTier(uint256 index) external view returns (Tier memory) {
        require(index < tiers.length, "Invalid tier index");
        return tiers[index];
    }

    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Allow contract to receive ETH for royalties
    receive() external payable {}
}
