import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Game" },
    { path: "/test-websocket", label: "WebSocket Test" },
    { path: "/about", label: "About" }
  ];

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-2 flex items-center space-x-2">
            <span className="font-bold text-lg">3D Flying Platformer</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === item.path
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <div className="text-xs text-muted-foreground">
            {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
          </div>
        </div>
      </div>
    </header>
  );
}