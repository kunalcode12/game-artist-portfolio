"use client";

import type { ReactNode } from "react";
import { LightboxProvider } from "@/components/lightbox/Lightbox";
import { AchievementsProvider } from "@/components/providers/AchievementsProvider";
import { BootProvider } from "@/components/providers/BootProvider";
import { DisplayModeProvider } from "@/components/providers/DisplayModeProvider";
import { SfxProvider } from "@/components/providers/SfxProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { TransitionProvider } from "@/components/providers/TransitionProvider";
import { Cursor } from "./Cursor";
import { Footer } from "./Footer";
import { Loader } from "./Loader";
import { Nav } from "./Nav";
import { ScrollProgress } from "./ScrollProgress";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <BootProvider>
      <SfxProvider>
        <AchievementsProvider>
          <SmoothScroll>
            <TransitionProvider>
              <DisplayModeProvider>
                <LightboxProvider>
                  <a href="#main" className="sr-only z-[300] bg-accent px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
                    Skip to content
                  </a>
                  <ScrollProgress />
                  <Nav />
                  <main id="main">{children}</main>
                  <Footer />
                  <Loader />
                  <Cursor />
                  <div className="grain" aria-hidden />
                </LightboxProvider>
              </DisplayModeProvider>
            </TransitionProvider>
          </SmoothScroll>
        </AchievementsProvider>
      </SfxProvider>
    </BootProvider>
  );
}
