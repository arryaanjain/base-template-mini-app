import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { BottomNavbar } from "~/components/ui/BottomNavbar";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-black min-h-screen">
        <Providers>
          <div className="min-h-screen pb-20">
            {children}
          </div>
          <BottomNavbar />
        </Providers>
      </body>
    </html>
  );
}
