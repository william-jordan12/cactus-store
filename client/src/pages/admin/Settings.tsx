import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.settings.get.useQuery();
  const updateMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.admin.settings.get.invalidate();
      utils.store.settings.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const [storeName, setStoreName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [visitorNotificationsEnabled, setVisitorNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setWhatsappNumber(settings.whatsappNumber);
      setContactEmail(settings.contactEmail);
      setPaymentsEnabled(settings.onlinePaymentsEnabled);
      setVisitorNotificationsEnabled(settings.visitorNotificationsEnabled);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      storeName: storeName.trim() || undefined,
      whatsappNumber: whatsappNumber.trim(),
      contactEmail: contactEmail.trim(),
      onlinePaymentsEnabled: paymentsEnabled,
      visitorNotificationsEnabled,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Store Settings">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Store Settings">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Basic store identity shown across the site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Store name</Label>
              <Input id="s-name" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact & WhatsApp Checkout</CardTitle>
            <CardDescription>
              The WhatsApp number receives customer orders. Include your country code (digits only), e.g.
              237650294923.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-whatsapp">WhatsApp phone number</Label>
              <Input
                id="s-whatsapp"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="650294923"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Contact email address</Label>
              <Input
                id="s-email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="sales@yourstore.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Online Payments</CardTitle>
            <CardDescription>
              Toggle the "Pay Online Now" button on the cart page. When disabled, customers can only checkout via
              WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Accept online card payments</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {paymentsEnabled
                    ? "The \"Pay Online Now\" button is shown on the cart page."
                    : "Only WhatsApp checkout is offered."}
                </div>
              </div>
              <Switch checked={paymentsEnabled} onCheckedChange={setPaymentsEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitor Notifications</CardTitle>
            <CardDescription>
              Get notified when someone new visits your site. Each genuinely new visitor (not seen in 24h) triggers a
              notification, throttled to one per 15 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Notify me about new visitors</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {visitorNotificationsEnabled
                    ? "You'll be notified when new visitors arrive."
                    : "New visitors are tracked but no notification is sent."}
                </div>
              </div>
              <Switch checked={visitorNotificationsEnabled} onCheckedChange={setVisitorNotificationsEnabled} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="font-bold">
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </AdminLayout>
  );
}
