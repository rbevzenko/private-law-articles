import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Stub = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <p className="font-serif text-xl md:text-2xl text-foreground text-center">
      Каталог находится по ссылке{" "}
      <a
        href="https://roman-bevzenko.com"
        className="text-primary underline underline-offset-4 hover:opacity-80"
      >
        https://roman-bevzenko.com
      </a>
    </p>
  </div>
);

const Catalog = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

const App = window.location.hostname === "private-law-articles.lovable.app"
  ? Stub
  : Catalog;

export default App;

