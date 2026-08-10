import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { destinationsQuery } from "@/lib/queries";
import { DEPARTMENTS, TRANSPORTS, transportLabel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DestinationsTab() {
  const qc = useQueryClient();
  const { data: destinations = [] } = useQuery(destinationsQuery);
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [transports, setTransports] = useState<string[]>(["trufi", "flota"]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shipping_destinations").insert({
        department,
        destination: destination.trim().slice(0, 120),
        transports,
        notes: notes.trim().slice(0, 300),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      setDestination("");
      setNotes("");
      toast.success("Destino agregado");
    },
    onError: () => toast.error("No se pudo agregar el destino"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("shipping_destinations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destinations"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_destinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Destino eliminado");
    },
  });

  const grouped = DEPARTMENTS.map((d) => ({
    department: d,
    items: destinations.filter((x) => x.department === d),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-lg border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (destination.trim().length < 2) {
            toast.error("Escribe la localidad");
            return;
          }
          create.mutate();
        }}
      >
        <h2 className="font-display text-2xl">Agregar destino de envío</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Localidad / ciudad</Label>
            <Input
              id="d-name"
              className="h-11"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Transportes disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORTS.map((t) => {
              const on = transports.includes(t.value);
              return (
                <Button
                  key={t.value}
                  type="button"
                  variant={on ? "default" : "outline"}
                  className="h-10 rounded-full"
                  onClick={() =>
                    setTransports(
                      on ? transports.filter((x) => x !== t.value) : [...transports, t.value],
                    )
                  }
                >
                  {t.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-notes">Nota para el cliente (opcional)</Label>
          <Input
            id="d-notes"
            className="h-11"
            placeholder="Ej: el transporte cobra extra al recoger"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-11 gap-2 rounded-full">
          <Plus className="h-4 w-4" /> Agregar destino
        </Button>
      </form>

      {grouped.map((g) => (
        <div key={g.department} className="space-y-2">
          <h3 className="font-display text-xl">{g.department}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {g.items.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.destination}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.transports.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {transportLabel(t)}
                      </Badge>
                    ))}
                  </div>
                  {d.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>
                  ) : null}
                </div>
                <Switch
                  checked={d.is_active}
                  onCheckedChange={(is_active) => toggle.mutate({ id: d.id, is_active })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove.mutate(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
