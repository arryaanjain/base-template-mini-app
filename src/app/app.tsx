"use client";

import { PageLayout } from "~/components/ui/PageLayout";
import Link from "next/link";

export default function App() {
  return (
    <PageLayout title="CryptoSocial">
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-black mb-4">
            Welcome to CryptoSocial! 🚀
          </h1>
          <p className="text-gray-600 mb-8">
            The Web3 social platform where your transactions tell a story. 
            Send ETH, add witty puns, and share them with the crypto community!
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-4">
          <Link href="/send">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">💸</div>
                <div>
                  <h3 className="font-semibold text-black">Send ETH</h3>
                  <p className="text-sm text-gray-600">Send transactions and add your crypto puns</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/feed">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">💬</div>
                <div>
                  <h3 className="font-semibold text-black">Social Feed</h3>
                  <p className="text-sm text-gray-600">See what the community is saying</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/create">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="font-semibold text-black">Browse Transactions</h3>
                  <p className="text-sm text-gray-600">Find past transactions to comment on</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Getting Started */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-black mb-3">🎯 Getting Started:</h3>
          <ol className="text-sm text-gray-700 space-y-2">
            <li>1. Connect your Web3 wallet (use testnet!)</li>
            <li>2. Send a small ETH transaction to another address</li>
            <li>3. Add your witty comment or crypto pun</li>
            <li>4. Share it on the social feed and get likes! 🎉</li>
          </ol>
        </div>
      </div>
    </PageLayout>
  );
}
