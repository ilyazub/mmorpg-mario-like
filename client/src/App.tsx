import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import MultiplayerGameContainer from "./components/MultiplayerGameContainer";
import WebSocketTester from "./components/WebSocketTester";
import NotFound from "./pages/not-found";
import Header from "./components/layout/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MultiplayerGameContainer} />
      <Route path="/test-websocket" component={WebSocketTester} />
      <Route path="/about" component={() => (
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-4">About the Game</h1>
          <p className="mb-4">
            This is a sophisticated multiplayer 3D flying-platformer game featuring a procedurally generated world
            with interactive obstacles, real-time player interaction, and combat mechanics.
          </p>
          <p className="mb-4">
            Built with Three.js and React, this game implements flying as a core gameplay mechanic,
            allowing players to freely explore the world in three dimensions.
          </p>
        </div>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Router />
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
