import type { Address } from "viem";

export const MAX_SPOT_LENGTH = 48;
export const MAX_REGION_LENGTH = 48;
export const MAX_MOOD_LENGTH = 32;
export const MAX_NOTE_LENGTH = 220;

export const trailPinAbi = [
  {
    type: "event",
    name: "PinDropped",
    inputs: [
      { name: "pinId", type: "uint256", indexed: true },
      { name: "traveler", type: "address", indexed: true },
      { name: "spot", type: "string", indexed: false },
      { name: "region", type: "string", indexed: false },
      { name: "mood", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "dropPin",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spot", type: "string" },
      { name: "region", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "pinId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getPin",
    stateMutability: "view",
    inputs: [{ name: "pinId", type: "uint256" }],
    outputs: [
      { name: "traveler", type: "address" },
      { name: "spot", type: "string" },
      { name: "region", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextPinId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredTrailPinContractAddress =
  process.env.NEXT_PUBLIC_TRAIL_PIN_CONTRACT_ADDRESS?.trim();

export const trailPinContractAddress = isAddressLike(configuredTrailPinContractAddress)
  ? (configuredTrailPinContractAddress as Address)
  : undefined;
