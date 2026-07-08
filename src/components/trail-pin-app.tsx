"use client";

import {
  BadgeCheck,
  Compass,
  Footprints,
  Loader2,
  LocateFixed,
  Map,
  MapPin,
  Mountain,
  Navigation,
  Search,
  Sparkles,
  Stars,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_MOOD_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_REGION_LENGTH,
  MAX_SPOT_LENGTH,
  trailPinAbi,
  trailPinContractAddress,
} from "@/lib/trail-pin";

const PRESETS = [
  {
    spot: "Morning Ferry Bench",
    region: "Victoria Harbour",
    mood: "quiet gold",
    note: "Sat with coffee before the city woke up. The water looked like folded metal and the skyline felt almost soft.",
  },
  {
    spot: "Blue Door Bookshop",
    region: "Old Town Lane",
    mood: "found",
    note: "Tiny shop behind a bakery. Bought a used map, left with rain on my jacket and a better route home.",
  },
  {
    spot: "Hilltop Night Market",
    region: "South Ridge",
    mood: "bright air",
    note: "Lanterns, grilled corn, and a long view over the road. Dropped this pin to remember the turnoff.",
  },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid spot")) return "Spot needs 1 to 48 characters.";
  if (error.message.includes("Invalid region")) return "Region needs 1 to 48 characters.";
  if (error.message.includes("Invalid mood")) return "Mood needs 1 to 32 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 220 characters.";
  return error.message;
}

function PinCard({
  spot,
  region,
  mood,
  note,
  traveler,
  createdAt,
}: {
  spot: string;
  region: string;
  mood: string;
  note: string;
  traveler?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="map-card">
      <div className="route-line" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="card-head">
        <div>
          <p className="eyebrow">Trail Pin</p>
          <h2>{spot || "Untitled spot"}</h2>
        </div>
        <div className="pin-badge">
          <MapPin aria-hidden="true" />
        </div>
      </div>

      <div className="map-grid" aria-hidden="true">
        <div className="route-dot dot-a" />
        <div className="route-dot dot-b" />
        <div className="route-dot dot-c" />
      </div>

      <div className="pin-meta">
        <section>
          <Navigation aria-hidden="true" />
          <p>Region</p>
          <strong>{region}</strong>
        </section>
        <section>
          <Stars aria-hidden="true" />
          <p>Mood</p>
          <strong>{mood}</strong>
        </section>
        <section>
          <Wallet aria-hidden="true" />
          <p>Traveler</p>
          <strong>{shortAddress(traveler)}</strong>
        </section>
        <section>
          <LocateFixed aria-hidden="true" />
          <p>Dropped</p>
          <strong>{formatDate(createdAt)}</strong>
        </section>
      </div>

      <section className="note-box">
        <p>Place note</p>
        <strong>{note || "Write the memory, landmark, or reason this pin matters."}</strong>
      </section>
    </article>
  );
}

export function TrailPinApp() {
  const [pinIdInput, setPinIdInput] = useState("1");
  const [spot, setSpot] = useState<string>(PRESETS[0].spot);
  const [region, setRegion] = useState<string>(PRESETS[0].region);
  const [mood, setMood] = useState<string>(PRESETS[0].mood);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Pin a place memory on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedPinId = BigInt(Math.max(1, Number(pinIdInput || "1")));

  const pinQuery = useReadContract({
    abi: trailPinAbi,
    address: trailPinContractAddress,
    functionName: "getPin",
    args: [parsedPinId],
    query: { enabled: Boolean(trailPinContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: trailPinAbi,
    address: trailPinContractAddress,
    functionName: "nextPinId",
    query: { enabled: Boolean(trailPinContractAddress), refetchInterval: 12000 },
  });

  const tuple = pinQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const livePin = useMemo(
    () =>
      tuple
        ? {
            traveler: tuple[0],
            spot: tuple[1],
            region: tuple[2],
            mood: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalPins = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    spot.trim().length > 0 &&
    spot.trim().length <= MAX_SPOT_LENGTH &&
    region.trim().length > 0 &&
    region.trim().length <= MAX_REGION_LENGTH &&
    mood.trim().length > 0 &&
    mood.trim().length <= MAX_MOOD_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !trailPinContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_TRAIL_PIN_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill spot, region, mood, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;
    void totalQuery.refetch();
    void pinQuery.refetch();
    const logs = parseEventLogs({ abi: trailPinAbi, logs: receipt.logs, eventName: "PinDropped" });
    const pinId = logs[0]?.args.pinId;
    window.setTimeout(() => {
      if (pinId) setPinIdInput(pinId.toString());
      setMessage(pinId ? `Trail pin #${pinId.toString()} dropped on Base.` : "Trail pin dropped on Base.");
    }, 0);
  }, [lastAction, receipt, pinQuery, totalQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Drop the pin when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function dropPin() {
    const contractAddress = trailPinContractAddress;
    if (createBlocker) {
      setMessage(createBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("create");
      setMessage("Confirm the trail pin in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: trailPinAbi,
        functionName: "dropPin",
        args: [spot.trim(), region.trim(), mood.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Trail pin sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setSpot(preset.spot);
    setRegion(preset.region);
    setMood(preset.mood);
    setNote(preset.note);
  }

  return (
    <main className="min-h-screen bg-[#edf7ff] text-[#122033]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-6">
        <aside className="trail-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Trail Pin</p>
              <h1>Pin a place memory.</h1>
            </div>
            <div className="panel-icon">
              <Compass aria-hidden="true" />
            </div>
          </div>

          <div className="metric-row">
            <div>
              <p>Pins</p>
              <strong>{totalPins}</strong>
            </div>
            <div>
              <p>Chain</p>
              <strong>Base</strong>
            </div>
          </div>

          <section className="form-box">
            <h2>New place</h2>
            <div className="preset-row">
              {PRESETS.map((preset, index) => (
                <button key={preset.spot} onClick={() => applyPreset(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <label>
              <span>Spot</span>
              <input value={spot} onChange={(event) => setSpot(event.target.value)} maxLength={MAX_SPOT_LENGTH} />
            </label>
            <label>
              <span>Region</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} maxLength={MAX_REGION_LENGTH} />
            </label>
            <label>
              <span>Mood</span>
              <input value={mood} onChange={(event) => setMood(event.target.value)} maxLength={MAX_MOOD_LENGTH} />
            </label>
            <label>
              <span>Note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={5} />
            </label>
          </section>

          <div className="action-stack">
            {isConnected && chainId !== base.id ? (
              <button className="primary warn" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button className="primary" disabled={writing || confirming} onClick={dropPin}>
                {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Drop Trail Pin
              </button>
            )}
            {isConnected ? (
              <button className="secondary" onClick={disconnectWallet}>
                {shortAddress(address)}
              </button>
            ) : (
              <button className="secondary" disabled={!selectedConnector || connecting} onClick={connectWallet}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}
            <p className="status">{message}</p>
            {hash ? (
              <a className="tx-link" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
                View transaction on BaseScan
              </a>
            ) : null}
          </div>
        </aside>

        <section className="display-stack">
          <PinCard
            spot={livePin?.spot || spot}
            region={livePin?.region || region}
            mood={livePin?.mood || mood}
            note={livePin?.note || note}
            traveler={livePin?.traveler}
            createdAt={livePin?.createdAt}
          />

          <div className="info-row">
            <section className="load-box">
              <div>
                <Search aria-hidden="true" />
                <h2>Load pin</h2>
              </div>
              <label>
                <span>Pin ID</span>
                <input value={pinIdInput} onChange={(event) => setPinIdInput(event.target.value.replace(/\D/g, ""))} />
              </label>
            </section>

            <section className="about-box">
              <p className="eyebrow">What it does</p>
              <p>
                Trail Pin drops a compact place memory with spot, region, mood, note, traveler wallet, and timestamp on
                Base.
              </p>
              <div>
                <span><Map aria-hidden="true" /> Place</span>
                <span><Footprints aria-hidden="true" /> Memory</span>
                <span><Mountain aria-hidden="true" /> Region</span>
                <span><BadgeCheck aria-hidden="true" /> On Base</span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
