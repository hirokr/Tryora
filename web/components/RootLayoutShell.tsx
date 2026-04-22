"use client";

import { usePathname } from "next/navigation";

import AppSidebar from "@/components/AppSidebar";

type RootLayoutShellProps = {
  enableSidebar: boolean;
  children: React.ReactNode;
};

export default function RootLayoutShell({ enableSidebar, children }: RootLayoutShellProps) {
  const pathname = usePathname();
  const showSidebar = enableSidebar && pathname !== "/";

  return (
    <>
      {showSidebar ? <AppSidebar /> : null}
      <div className={showSidebar ? "xl:pl-72" : ""}>{children}</div>
    </>
  );
} // Layout shell that conditionally renders the sidebar based on the current route and authentication status
