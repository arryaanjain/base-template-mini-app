"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";

interface WalletConnectionProps {
  onConnect?: () => void;
}

export function WalletConnection({ onConnect }: WalletConnectionProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = (connector: any) => {
    connect({ connector });
    if (onConnect) {
      onConnect();
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {truncateAddress(address)}
          </span>
        </div>
        <Button 
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 text-sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 text-sm mb-4">
          Choose a wallet to connect and start sharing your trading activity
        </p>
      </div>
      
      <div className="space-y-2">
        {connectors.map((connector) => (
          <Button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            className="w-full"
          >
            Connect {connector.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
