"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  PlusCircleIcon, 
  CurrencyDollarIcon, 
  ChatBubbleBottomCenterTextIcon 
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeSolid, 
  PlusCircleIcon as PlusSolid, 
  CurrencyDollarIcon as CurrencySolid, 
  ChatBubbleBottomCenterTextIcon as ChatSolid 
} from "@heroicons/react/24/solid";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    activeIcon: HomeSolid,
  },
  {
    name: "Feed",
    href: "/feed",
    icon: ChatBubbleBottomCenterTextIcon,
    activeIcon: ChatSolid,
  },
  {
    name: "Send",
    href: "/send",
    icon: CurrencyDollarIcon,
    activeIcon: CurrencySolid,
  },
  {
    name: "Create",
    href: "/create",
    icon: PlusCircleIcon,
    activeIcon: PlusSolid,
  },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
