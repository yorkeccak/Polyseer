"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const UnicornScene = dynamic(() => import("unicornstudio-react"), {
  ssr: false,
});

const Dither = dynamic(() => import("./dither"), {
  ssr: false,
});

// Light mode project ID for Unicorn Studio
const LIGHT_MODE_PROJECT_ID = "1grEuiVDSVmyvEMAYhA6";

export const OpenAICodexAnimatedBackground = () => {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 1920,
    height: 1080,
  });

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    // Check dark mode state - only use class-based detection
    // The class is the source of truth, set by ThemeSwitcher
    const checkDarkMode = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const hasLightClass = document.documentElement.classList.contains('light');

      // If explicit class is set, use that
      if (hasDarkClass) {
        setIsDarkMode(true);
      } else if (hasLightClass) {
        setIsDarkMode(false);
      } else {
        // Fallback to system preference only if no class is set
        // But default to light if nothing is set
        setIsDarkMode(false);
      }
    };

    checkDarkMode();

    // Listen for dark mode changes via class mutations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      checkDarkMode();
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  // Don't render on server
  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900" />;
  }

  // Dark mode: use Dither component
  if (isDarkMode) {
    return (
      <div className={cn("fixed inset-0 -z-10")}>
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
    );
  }

  // Light mode: use Unicorn Studio
  return (
    <div className={cn("fixed inset-0 -z-10")}>
      <UnicornScene
        production={true}
        projectId={LIGHT_MODE_PROJECT_ID}
        width={windowSize.width}
        height={windowSize.height}
      />
    </div>
  );
};