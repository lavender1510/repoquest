import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoQuest — Verwandle Code in Abenteuer",
  description: "GitHub-Repositories als lebendige RPG-Weltkarte. Read-only GitHub Analytics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
