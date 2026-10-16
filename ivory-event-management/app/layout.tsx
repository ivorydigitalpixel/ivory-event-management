import "./globals.css";
export const metadata = { title: "Ivory Event Management", description: "Plan Every Event. Manage Every Detail." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen">{children}</body></html>);
}
