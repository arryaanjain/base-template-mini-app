"use client";

import { useState } from "react";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { useAccount } from "wagmi";
import { WalletConnection } from "./WalletConnection";
import Link from "next/link";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const { isConnected } = useAccount();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [hasClickedPfp, setHasClickedPfp] = useState(false);

  return (
    <div className="relative">
      <div className="mb-1 py-2 px-3 bg-card text-card-foreground rounded-lg flex items-center justify-between border-[3px] border-double border-primary">
        <div className="flex items-center space-x-6">
          <div className="text-lg font-light">CryptoSocial</div>
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className="text-sm hover:text-primary transition-colors">
              Feed
            </Link>
            <Link href="/send" className="text-sm hover:text-primary transition-colors">
              Send ETH
            </Link>
            <Link href="/create" className="text-sm hover:text-primary transition-colors">
              Browse Transactions
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Wallet Connection Status */}
          {isConnected ? (
            <WalletConnection />
          ) : (
            <span className="text-sm text-gray-500">Not Connected</span>
          )}
          
          {/* Farcaster User Profile (if available) */}
          {context?.user && (
            <div
              className="cursor-pointer"
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setHasClickedPfp(true);
              }}
            >
              {context.user.pfpUrl && (
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
              )}
            </div>
          )}
        </div>
      </div>
      {context?.user && (
        <>
          {!hasClickedPfp && (
            <div className="absolute right-0 -bottom-6 text-xs text-primary flex items-center justify-end gap-1 pr-2">
              <span className="text-[10px]">↑</span> Click PFP!{" "}
              <span className="text-[10px]">↑</span>
            </div>
          )}

          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 z-50 w-fit mt-1 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
              <div className="p-3 space-y-2">
                <div className="text-right">
                  <h3
                    className="font-bold text-sm hover:underline cursor-pointer inline-block text-foreground"
                    onClick={() =>
                      sdk.actions.viewProfile({ fid: context.user.fid })
                    }
                  >
                    {context.user.displayName || context.user.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    @{context.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    FID: {context.user.fid}
                  </p>
                  {neynarUser && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Neynar Score: {neynarUser.score}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
