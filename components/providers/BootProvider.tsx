"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

type BootState = { booted: boolean; finish: () => void };

const BootContext = createContext<BootState>({ booted: true, finish: () => {} });

/** `booted` flips to true once the boot screen starts exiting — hero intros key off it. */
export function BootProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const finish = useCallback(() => setBooted(true), []);
  const value = useMemo(() => ({ booted, finish }), [booted, finish]);
  return <BootContext value={value}>{children}</BootContext>;
}

export const useBoot = () => use(BootContext);

export const BOOT_FLAG = "ss-booted";

/** Runs in <head> before paint: returning visitors in the same tab session skip the boot screen. */
export const bootScript = `(function(){try{if(sessionStorage.getItem("${BOOT_FLAG}")==="1")document.documentElement.classList.add("booted")}catch(e){}})()`;
