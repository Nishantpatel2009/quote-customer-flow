import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NewCustomer from "./pages/NewCustomer";
import ExistingCustomers from "./pages/ExistingCustomers";
import NewQuotation from "./pages/NewQuotation";
import CustomerDetail from "./pages/CustomerDetail";
import QuoteDetail from "./pages/QuoteDetail";
import EditQuotation from "./pages/EditQuotation";
import Reports from "./pages/Reports";
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
          <Route path="/reports" element={<Reports />} />
          <Route path="/customer/:customerId" element={<CustomerDetail />} />
          <Route path="/customer/:customerId/new-quotation" element={<NewQuotation />} />
          <Route path="/quote/:quoteId" element={<QuoteDetail />} />
          <Route path="/quote/:quoteId/edit" element={<EditQuotation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
