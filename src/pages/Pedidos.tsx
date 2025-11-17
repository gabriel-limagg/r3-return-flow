import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Pedido {
  id: string;
  pedido_codigo: string;
  romaneio: string;
  colaborador: string;
  base: string;
  status: string;
  data_cadastro: string;
  updated_at: string;
  portadores: { nome: string; codigo: string } | null;
  clientes: { nome: string } | null;
}

export default function Pedidos() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchPedido, setSearchPedido] = useState("");
  const [searchRomaneio, setSearchRomaneio] = useState("");
  const [searchPortador, setSearchPortador] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  const [filterBase, setFilterBase] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [dateInicio, setDateInicio] = useState("");
  const [dateFim, setDateFim] = useState("");

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos_devolucao")
      .select(`
        *,
        portadores(nome, codigo),
        clientes(nome)
      `)
      .order("data_cadastro", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPedidos(data as Pedido[]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    // Filtros de busca separados
    const matchesPedido = !searchPedido || pedido.pedido_codigo.toLowerCase().includes(searchPedido.toLowerCase());
    const matchesRomaneio = !searchRomaneio || pedido.romaneio.toLowerCase().includes(searchRomaneio.toLowerCase());
    const matchesPortador = !searchPortador || pedido.portadores?.nome.toLowerCase().includes(searchPortador.toLowerCase()) || pedido.portadores?.codigo.toLowerCase().includes(searchPortador.toLowerCase());
    const matchesCliente = !searchCliente || pedido.clientes?.nome.toLowerCase().includes(searchCliente.toLowerCase());

    // Filtro de base
    const matchesBase = filterBase === "Todas" || pedido.base === filterBase;

    // Filtro de status
    const matchesStatus = filterStatus === "Todos" || pedido.status === filterStatus;

    // Filtro de data
    let matchesDate = true;
    if (dateInicio) {
      const cadastroDate = new Date(pedido.data_cadastro);
      const inicioDate = new Date(dateInicio);
      matchesDate = cadastroDate >= inicioDate;
    }
    if (dateFim && matchesDate) {
      const editDate = new Date(pedido.updated_at);
      const fimDate = new Date(dateFim);
      fimDate.setHours(23, 59, 59, 999);
      matchesDate = editDate <= fimDate;
    }

    return matchesPedido && matchesRomaneio && matchesPortador && matchesCliente && matchesBase && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">R3 Devoluções</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/cadastro")} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search-pedido">Pedido</Label>
                <Input
                  id="search-pedido"
                  placeholder="Buscar pedido..."
                  value={searchPedido}
                  onChange={(e) => setSearchPedido(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-romaneio">Romaneio</Label>
                <Input
                  id="search-romaneio"
                  placeholder="Buscar romaneio..."
                  value={searchRomaneio}
                  onChange={(e) => setSearchRomaneio(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-portador">Portador</Label>
                <Input
                  id="search-portador"
                  placeholder="Buscar portador..."
                  value={searchPortador}
                  onChange={(e) => setSearchPortador(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-cliente">Cliente</Label>
                <Input
                  id="search-cliente"
                  placeholder="Buscar cliente..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Base</Label>
                <Select value={filterBase} onValueChange={setFilterBase}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="A Devolver">A Devolver</SelectItem>
                    <SelectItem value="Em processo de devolução">Em processo de devolução</SelectItem>
                    <SelectItem value="Devolvido">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-inicio">Data Cadastro (Inicial)</Label>
                <Input
                  id="date-inicio"
                  type="date"
                  value={dateInicio}
                  onChange={(e) => setDateInicio(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-fim">Data Edição (Final)</Label>
                <Input
                  id="date-fim"
                  type="date"
                  value={dateFim}
                  onChange={(e) => setDateFim(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchPedido("");
                    setSearchRomaneio("");
                    setSearchPortador("");
                    setSearchCliente("");
                    setFilterBase("Todas");
                    setFilterStatus("Todos");
                    setDateInicio("");
                    setDateFim("");
                  }}
                  className="w-full h-11"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p>Carregando pedidos...</p>
              </CardContent>
            </Card>
          ) : filteredPedidos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPedidos.map((pedido) => {
              const getHoverColor = () => {
                switch (pedido.status) {
                  case "Em processo de devolução":
                    return "hover:bg-warning/20";
                  case "Devolvido":
                    return "hover:bg-success/20";
                  default:
                    return "hover:bg-destructive/20";
                }
              };

              return (
                <Card
                  key={pedido.id}
                  className={`cursor-pointer transition-colors ${getHoverColor()}`}
                  onClick={() => navigate(`/pedidos/${pedido.id}/editar`)}
                >
                <CardContent className="py-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pedido</p>
                      <p className="font-medium">{pedido.pedido_codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Romaneio</p>
                      <p className="font-medium">{pedido.romaneio}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Portador</p>
                      <p className="font-medium">
                        {pedido.portadores?.codigo} - {pedido.portadores?.nome}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{pedido.clientes?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Colaborador</p>
                      <p className="font-medium">{pedido.colaborador}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Base</p>
                      <p className="font-medium">{pedido.base}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <StatusBadge status={pedido.status} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {format(new Date(pedido.data_cadastro), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
