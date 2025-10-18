"use client";

import { useState, useEffect, useRef } from "react";
// import { APP_NAME } from "~/lib/constants"; // Not used
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { useAccount, useDisconnect } from "wagmi";
import { WalletConnection } from "./WalletConnection";
import Link from "next/link";
import { truncateAddress } from "~/lib/truncateAddress";
import { usePathname } from "next/navigation";
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
  CurrencyDollarIcon,
  PlusCircleIcon,
  WalletIcon
} from "@heroicons/react/24/outline";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

const navItems = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Feed", href: "/feed", icon: ChatBubbleBottomCenterTextIcon },
  { name: "Send", href: "/send", icon: CurrencyDollarIcon },
  { name: "Create", href: "/create", icon: PlusCircleIcon },
];

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    }

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWalletDropdownOpen]);

  return (
    <div className="relative">
      <div className="mb-1 py-3 px-4 bg-white text-black rounded-lg flex items-center justify-between border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="text-lg font-semibold text-black">CryptoSocial</div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* Desktop Wallet Connection */}
          <div className="hidden md:block">
            <WalletConnection />
          </div>

          {/* Mobile Wallet Button */}
          <div className="md:hidden relative" ref={walletDropdownRef}>
            {isConnected && address ? (
              <button
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center space-x-1"
              >
                <WalletIcon className="h-5 w-5" />
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </button>
            ) : (
              <button
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <WalletIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          
          {/* Farcaster User Profile (if available) */}
          {context?.user && (
            <div
              className="cursor-pointer"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              {context.user.pfpUrl && (
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
          <nav className="flex flex-col py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Mobile Wallet Dropdown */}
      {isWalletDropdownOpen && (
        <div className="md:hidden absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {isConnected && address ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-black">
                      {truncateAddress(address)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setIsWalletDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <div className="text-center">
                <h3 className="text-sm font-semibold mb-2 text-black">Connect Wallet</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Connect to start using the app
                </p>
                <WalletConnection onConnect={() => setIsWalletDropdownOpen(false)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Dropdown */}
      {context?.user && isUserDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              {context.user.pfpUrl && (
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-black">
                  {context.user.displayName || context.user.username}
                </div>
                <div className="text-sm text-gray-500">
                  @{context.user.username}
                </div>
                <div className="text-sm text-gray-500">
                  FID: {context.user.fid}
                </div>
                {neynarUser && (
                  <div className="text-sm text-gray-500">
                    Neynar Score: {neynarUser.score}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => sdk.actions.viewProfile({ fid: context.user!.fid })}
              className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
