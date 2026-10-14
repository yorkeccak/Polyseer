import Image from "next/image";
import { cn } from "@/lib/utils";
import { getPlatformName, type MarketPlatform } from "@/lib/tools/market-url-parser";

export function PlatformLogo({ platform, className }: { platform: MarketPlatform; className?: string }) {
  return (
    <Image
      src={`/logos/${platform}.png`}
      alt={getPlatformName(platform)}
      width={32}
      height={32}
      className={cn("size-4 shrink-0 rounded-[4px]", className)}
    />
  );
}
