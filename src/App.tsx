import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NewCustomer from "./pages/NewCustomer";
import ExistingCustomers from "./pages/ExistingCustomers";
import CustomerDetail from "./pages/CustomerDetail";
import NewQuotation from "./pages/NewQuotation";
import QuoteDetail from "./pages/QuoteDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/new-customer" element={<NewCustomer />} />
          <Route path="/existing-customers" element={<ExistingCustomers />} />
          <Route path="/customer/:customerId" element={<CustomerDetail />} />
          <Route path="/new-quotation/:customerId" element={<NewQuotation />} />
          <Route path="/quote/:quoteId" element={<QuoteDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
