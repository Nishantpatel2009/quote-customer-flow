import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Quotation Manager
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional interior design quotation system
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className="p-8 hover:shadow-elegant transition-all duration-300 cursor-pointer group" onClick={() => navigate('/new-customer')}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">New Customer</h2>
              <p className="text-muted-foreground mb-6">
                Register a new customer and create their first quotation
              </p>
              <Button className="w-full" size="lg">
                Get Started
              </Button>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-elegant transition-all duration-300 cursor-pointer group" onClick={() => navigate('/existing-customers')}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Existing Customer</h2>
              <p className="text-muted-foreground mb-6">
                View customer list and manage their quotations
              </p>
              <Button variant="secondary" className="w-full" size="lg">
                View Customers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
