"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithClient } from "@/types/database";
import OrderGrid from "@/components/tv/OrderGrid";
import StatsPanel from "@/components/tv/StatsPanel";
import Clock from "@/components/tv/Clock";
import FullscreenButton from "@/components/tv/FullscreenButton";
import QRCode from "react-qr-code";

export default function TVDashboard() {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Auto-enter fullscreen on mount (requires user interaction, so we'll try on first click)
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const element = document.documentElement;
        if (
          !document.fullscreenElement &&
          !(document as any).webkitFullscreenElement &&
          !(document as any).mozFullScreenElement &&
          !(document as any).msFullscreenElement
        ) {
          if (element.requestFullscreen) {
            await element.requestFullscreen().catch(() => {
              // User denied or error, ignore
            });
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen().catch(() => {});
          } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen().catch(() => {});
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen().catch(() => {});
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    // Try to enter fullscreen after a short delay (allows page to load)
    const timer = setTimeout(() => {
      // Only attempt if user has interacted with the page
      const handleFirstInteraction = () => {
        enterFullscreen();
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("keydown", handleFirstInteraction);
      };

      document.addEventListener("click", handleFirstInteraction, { once: true });
      document.addEventListener("keydown", handleFirstInteraction, { once: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch initial orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, clients(*)")
          .order("due_date", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Fetched orders:", data?.length || 0);
        setOrders((data as OrderWithClient[]) || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    }

    fetchOrders();
  }, [supabase]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async () => {
          // Refetch orders when any change occurs
          const { data, error } = await supabase
            .from("orders")
            .select("*, clients(*)")
            .order("due_date", { ascending: true })
            .order("created_at", { ascending: false });

          if (!error && data) {
            setOrders(data as OrderWithClient[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Group orders by client
  const groupedOrders = useMemo(() => {
    const groups = new Map<
      string,
      { clientName: string; clientLogoUrl: string | null; orders: OrderWithClient[] }
    >();

    orders.forEach((order) => {
      const clientId = order.client_id;
      if (!groups.has(clientId)) {
        groups.set(clientId, {
          clientName: order.clients.name,
          clientLogoUrl: order.clients.logo_url,
          orders: [],
        });
      }
      groups.get(clientId)!.orders.push(order);
    });

    // Sort orders within each group by due_date (ascending) then created_at (descending)
    groups.forEach((group) => {
      group.orders.sort((a, b) => {
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    // Convert to array and sort groups by client name
    return Array.from(groups.entries())
      .map(([clientId, group]) => ({
        clientId,
        clientName: group.clientName,
        clientLogoUrl: group.clientLogoUrl,
        orders: group.orders,
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [orders]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-slate-400 text-xl">Cargando órdenes...</div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-slate-400 text-xl">No se encontraron órdenes</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-slate-900 relative">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-1">
              Tablero de Producción
            </h1>
            <div className="text-slate-400 text-base">
              {orders.length} {orders.length === 1 ? "orden" : "órdenes"} en{" "}
              {groupedOrders.length} {groupedOrders.length === 1 ? "cliente" : "clientes"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock />
            <FullscreenButton />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Stats Panel (30%) */}
          <div className="col-span-12 lg:col-span-3">
            <StatsPanel orders={orders} />
          </div>

          {/* Right Column - Orders Grid (70%) */}
          <div className="col-span-12 lg:col-span-9 overflow-y-auto max-h-[calc(100vh-200px)] pb-[180px]">
            {/* Orders Grid with Client Grouping */}
            <OrderGrid groupedOrders={groupedOrders} />
          </div>
        </div>
      </div>

      {/* QR Code - Bottom Right */}
      <div className="fixed bottom-6 right-6 bg-white p-4 rounded-lg shadow-2xl z-10">
        <QRCode
          value="http://localhost:3000/admin"
          size={120}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox="0 0 120 120"
        />
        <p className="text-xs text-slate-700 text-center mt-2 font-medium">
          Escanear para Actualizar Órdenes
        </p>
      </div>
    </main>
  );
}
