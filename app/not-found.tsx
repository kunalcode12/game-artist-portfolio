import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/chrome/NotFoundScreen";

export const metadata: Metadata = { title: "Game Over — 404" };

export default function NotFound() {
  return <NotFoundScreen />;
}
