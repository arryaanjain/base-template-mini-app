"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "~/components/ui/Button";
import { Header } from "~/components/ui/Header";
import { WalletConnection } from "~/components/ui/WalletConnection";
import { fetchWithAuth } from "~/lib/auth";

export default function SendTransaction() {
  const { address, isConnected } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<"send" | "comment" | "success">("send");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const {
    sendTransaction,
    error: sendError,
    isPending: isSendingTx,
    data: txHash,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // When transaction is confirmed, move to comment step
  if (isConfirmed && txHash && step === "send") {
    setCompletedTxHash(txHash);
    setStep("comment");
  }

  const handleSendTransaction = async () => {
    if (!recipientAddress || !amount) return;

    try {
      sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handlePostComment = async () => {
    if (!comment.trim() || !completedTxHash) return;

    setIsPostingComment(true);
    try {
      // Create a transaction object for our post
      const transactionData = {
        hash: completedTxHash,
        from: address,
        to: recipientAddress,
        value: parseEther(amount).toString(),
        valueInEth: amount,
        gasPrice: "0",
        gasUsed: "21000",
        timestamp: Date.now(),
        blockNumber: "0",
        isError: false,
        type: "eth_transfer" as const,
        description: `Sent ${amount} ETH to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`
      };

      const response = await fetchWithAuth('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: transactionData,
          comment: comment.trim(),
          walletAddress: address
        })
      });

      if (response.ok) {
        setStep("success");
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const resetFlow = () => {
    setStep("send");
    setRecipientAddress("");
    setAmount("");
    setComment("");
    setCompletedTxHash(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
            <WalletConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8">
        {step === "send" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Send ETH Transaction
            </h1>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6 border-l-4 border-purple-400">
              <h3 className="font-semibold text-purple-900 mb-2">🚀 How it works:</h3>
              <ol className="text-sm text-purple-800 space-y-1">
                <li>1. Send ETH to another address (use testnet!)</li>
                <li>2. Add your witty pun/comment about the transaction</li>
                <li>3. Share it on the public social feed</li>
                <li>4. Get likes from the crypto community! 🎉</li>
              </ol>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.001"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  💡 <strong>Tip:</strong> Use a testnet (Goerli, Sepolia) for testing. 
                  Send small amounts like 0.001 ETH.
                </p>
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-700 hover:text-blue-900">
                    Need a test address? Click here for examples
                  </summary>
                  <div className="mt-2 space-y-1 font-mono text-xs">
                    <p 
                      className="cursor-pointer hover:bg-blue-100 p-1 rounded"
                      onClick={() => setRecipientAddress("0x742d35Cc6634C0532925a3b8D4C44B9388c3b73B")}
                    >
                      0x742d35Cc6634C0532925a3b8D4C44B9388c3b73B
                    </p>
                    <p 
                      className="cursor-pointer hover:bg-blue-100 p-1 rounded"
                      onClick={() => setRecipientAddress("0x8ba1f109551bD432803012645Hac136c")}
                    >
                      0x8ba1f109551bD432803012645Hac136c55136c55
                    </p>
                  </div>
                </details>
              </div>

              {sendError && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">Error: {sendError.message}</p>
                </div>
              )}

              <Button
                onClick={handleSendTransaction}
                disabled={!recipientAddress || !amount || isSendingTx || isConfirming}
                isLoading={isSendingTx || isConfirming}
                className="w-full"
              >
                {isSendingTx && "Sending Transaction..."}
                {isConfirming && "Confirming..."}
                {!isSendingTx && !isConfirming && "Send ETH"}
              </Button>

              {txHash && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 text-sm">
                    Transaction Hash: {txHash}
                  </p>
                  {isConfirming && (
                    <p className="text-green-600 text-sm mt-2">
                      Waiting for confirmation...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "comment" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              🎉 Transaction Complete! Add Your Pun
            </h1>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Your Transaction:</h3>
              <p className="text-sm text-gray-600">
                Sent {amount} ETH to {recipientAddress.slice(0, 10)}...{recipientAddress.slice(-8)}
              </p>
              <p className="text-sm text-gray-500">
                Hash: {completedTxHash?.slice(0, 20)}...
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Your Witty Comment / Pun
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Just sent some ETH... guess you could say I'm feeling generous! 😄"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={280}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {comment.length}/280 characters
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handlePostComment}
                  disabled={!comment.trim() || isPostingComment}
                  isLoading={isPostingComment}
                  className="flex-1"
                >
                  Post to Public Feed
                </Button>
                
                <Button
                  onClick={resetFlow}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  Send Another Transaction
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Posted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your transaction and witty comment have been added to the public feed.
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = '/feed'}
                className="w-full"
              >
                View Public Feed
              </Button>
              
              <Button
                onClick={resetFlow}
                className="w-full bg-gray-500 hover:bg-gray-600"
              >
                Send Another Transaction
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
