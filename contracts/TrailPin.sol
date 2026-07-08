// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrailPin {
    uint256 public nextPinId = 1;

    struct Pin {
        address traveler;
        string spot;
        string region;
        string mood;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Pin) private pins;

    event PinDropped(
        uint256 indexed pinId,
        address indexed traveler,
        string spot,
        string region,
        string mood
    );

    function dropPin(
        string calldata spot,
        string calldata region,
        string calldata mood,
        string calldata note
    ) external returns (uint256 pinId) {
        require(bytes(spot).length > 0 && bytes(spot).length <= 48, "Invalid spot");
        require(bytes(region).length > 0 && bytes(region).length <= 48, "Invalid region");
        require(bytes(mood).length > 0 && bytes(mood).length <= 32, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 220, "Invalid note");

        pinId = nextPinId++;
        pins[pinId] = Pin({
            traveler: msg.sender,
            spot: spot,
            region: region,
            mood: mood,
            note: note,
            createdAt: block.timestamp
        });

        emit PinDropped(pinId, msg.sender, spot, region, mood);
    }

    function getPin(
        uint256 pinId
    )
        external
        view
        returns (
            address traveler,
            string memory spot,
            string memory region,
            string memory mood,
            string memory note,
            uint256 createdAt
        )
    {
        Pin storage entry = pins[pinId];
        return (
            entry.traveler,
            entry.spot,
            entry.region,
            entry.mood,
            entry.note,
            entry.createdAt
        );
    }
}
