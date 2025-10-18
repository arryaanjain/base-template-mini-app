"use client";

import { Header } from "./Header";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
}

export function PageLayout({ children, title, neynarUser }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="p-4">
            <Header neynarUser={neynarUser} />
          </div>
        </div>

        {/* Page Title */}
        {title && (
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-black">{title}</h1>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
