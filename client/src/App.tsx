import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Game from "./components/Game";
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import WebSocketTester from "./components/WebSocketTester";
import TestCanvas from "./components/TestCanvas";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Game isFullscreen={true} />} />
      <Route path="/about" component={() => (
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-4">About the Game</h1>
          <p className="mb-4">
            This is a sophisticated multiplayer 3D flying-platformer game featuring a procedurally generated world
            with interactive obstacles, real-time player interaction, and combat mechanics.
          </p>
          <p className="mb-4">
            Built with React Three Fiber and React, this game implements flying as a core gameplay mechanic,
            allowing players to freely explore the world in three dimensions.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Back to Game
            </Link>
          </div>
        </div>
      )} />
      <Route path="/test-websocket" component={() => (
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-4">WebSocket Testing</h1>
          <p className="mb-4">
            Use this page to test the WebSocket connection for multiplayer features.
          </p>
          <WebSocketTester />
          <div className="mt-6">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Back to Game
            </Link>
          </div>
        </div>
      )} />
      <Route path="/test-canvas" component={TestCanvas} />
      <Route component={NotFound} />
    </Switch>
  );
}

function NavBar({ hideOnPath = [] }: { hideOnPath?: string[] }) {
  const [location] = useLocation();
  
  // Don't render navbar on specified paths
  if (hideOnPath.includes(location)) {
    return null;
  }
  
  return (
    <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
      <div className="font-bold text-xl">Hubaoba</div>
      <div className="flex space-x-4">
        <Link href="/" className="hover:text-blue-300">Game</Link>
        <Link href="/test-websocket" className="hover:text-blue-300">WebSocket Test</Link>
        <Link href="/test-canvas" className="hover:text-blue-300">Test 3D</Link>
        <Link href="/about" className="hover:text-blue-300">About</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme>
        <div className="min-h-screen flex flex-col">
          <NavBar hideOnPath={["/"]} />
          <main className="flex-1">
            <Router />
          </main>
          <Toaster />
        </div>
      </Theme>
    </QueryClientProvider>
  );
}

export default App;
