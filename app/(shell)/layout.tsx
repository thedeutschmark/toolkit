import ToolkitShell from "@/components/toolkit/ToolkitShell";
import type { ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <ToolkitShell>{children}</ToolkitShell>;
}
