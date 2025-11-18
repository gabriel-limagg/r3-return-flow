import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComboboxSearchable, ComboboxOption } from "@/components/ComboboxSearchable";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import logoPrincipal from "@/assets/logo-principal.png";

export default function CadastroPedido() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [pedidoCodigo, setPedidoCodigo] = useState("");
  const [romaneio, setRomaneio] = useState("");
  const [portadorId, setPortadorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [base, setBase] = useState("SP");
  const [status, setStatus] = useState("A Devolver");

  const [portadores, setPortadores] = useState<ComboboxOption[]>([]);
  const [clientes, setClientes] = useState<ComboboxOption[]>([]);

  // Estados para diálogos de novo portador/cliente
  const [showPortadorDialog, setShowPortadorDialog] = useState(false);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [newPortadorCodigo, setNewPortadorCodigo] = useState("");
  const [newPortadorNome, setNewPortadorNome] = useState("");
  const [newClienteCodigo, setNewClienteCodigo] = useState("");
  const [newClienteNome, setNewClienteNome] = useState("");
  const [addingPortador, setAddingPortador] = useState(false);
  const [addingCliente, setAddingCliente] = useState(false);

  useEffect(() => {
    loadPortadores();
    loadClientes();
  }, []);

  const loadPortadores = async () => {
    const { data, error } = await supabase
      .from("portadores")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      toast({
        title: "Erro ao carregar portadores",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const options = data.map(p => ({
      value: p.id,
      label: `${p.codigo} - ${p.nome}`,
    }));
    setPortadores(options);
  };

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const options = data.map(c => ({
      value: c.id,
      label: c.nome,
    }));
    setClientes(options);
  };

  const handleAddPortador = async () => {
    if (!newPortadorCodigo || !newPortadorNome) {
      toast({
        title: "Erro",
        description: "Preencha código e nome do portador.",
        variant: "destructive",
      });
      return;
    }

    setAddingPortador(true);
    const { data, error } = await supabase
      .from("portadores")
      .insert({
        codigo: newPortadorCodigo,
        nome: newPortadorNome,
        base: base,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar portador",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Portador adicionado com sucesso.",
      });
      setNewPortadorCodigo("");
      setNewPortadorNome("");
      setShowPortadorDialog(false);
      await loadPortadores();
      setPortadorId(data.id);
    }
    setAddingPortador(false);
  };

  const handleAddCliente = async () => {
    if (!newClienteNome) {
      toast({
        title: "Erro",
        description: "Preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    setAddingCliente(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        codigo: newClienteCodigo || null,
        nome: newClienteNome,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Cliente adicionado com sucesso.",
      });
      setNewClienteCodigo("");
      setNewClienteNome("");
      setShowClienteDialog(false);
      await loadClientes();
      setClienteId(data.id);
    }
    setAddingCliente(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!pedidoCodigo || !romaneio || !portadorId || !clienteId || !colaborador) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("pedidos_devolucao").insert({
      pedido_codigo: pedidoCodigo,
      romaneio,
      portador_id: portadorId,
      cliente_id: clienteId,
      colaborador,
      base,
      status,
    });

    if (error) {
      toast({
        title: "Erro ao cadastrar pedido",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Pedido cadastrado com sucesso.",
      });
      
      // Limpar formulário
      setPedidoCodigo("");
      setRomaneio("");
      setPortadorId("");
      setClienteId("");
      setColaborador("");
      setBase("SP");
      setStatus("A Devolver");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <img src={logoPrincipal} alt="R3 Express Logo" className="h-10" />
          <Button
            variant="ghost"
            onClick={() => navigate("/pedidos")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para pedidos
          </Button>
        </div>

        <Card className="shadow-lg bg-gradient-card">
          <CardHeader>
            <CardTitle>Cadastrar Novo Pedido de Devolução</CardTitle>
            <CardDescription>Preencha os dados abaixo para cadastrar um novo pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pedido-codigo">Pedido (Código) *</Label>
                  <Input
                    id="pedido-codigo"
                    value={pedidoCodigo}
                    onChange={(e) => setPedidoCodigo(e.target.value)}
                    placeholder="Digite o código do pedido"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="romaneio">Romaneio *</Label>
                  <Input
                    id="romaneio"
                    value={romaneio}
                    onChange={(e) => setRomaneio(e.target.value)}
                    placeholder="Digite o romaneio"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Portador *</Label>
                  <ComboboxSearchable
                    options={portadores}
                    value={portadorId}
                    onChange={setPortadorId}
                    placeholder="Selecione o portador"
                    searchPlaceholder="Buscar portador..."
                    emptyText="Nenhum portador encontrado."
                    onAddNew={() => setShowPortadorDialog(true)}
                    addNewLabel="+ Adicionar novo portador"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <ComboboxSearchable
                    options={clientes}
                    value={clienteId}
                    onChange={setClienteId}
                    placeholder="Selecione o cliente"
                    searchPlaceholder="Buscar cliente..."
                    emptyText="Nenhum cliente encontrado."
                    onAddNew={() => setShowClienteDialog(true)}
                    addNewLabel="+ Adicionar novo cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colaborador">Colaborador *</Label>
                  <Select value={colaborador} onValueChange={setColaborador}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARIELY">ARIELY</SelectItem>
                      <SelectItem value="AUGUSTO">AUGUSTO</SelectItem>
                      <SelectItem value="DAYANE">DAYANE</SelectItem>
                      <SelectItem value="LARISSA">LARISSA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base">Base *</Label>
                  <Select value={base} onValueChange={setBase}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A Devolver">A Devolver</SelectItem>
                      <SelectItem value="Em processo de devolução">Em processo de devolução</SelectItem>
                      <SelectItem value="Devolvido">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Pedido"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/pedidos")}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para adicionar novo portador */}
      <Dialog open={showPortadorDialog} onOpenChange={setShowPortadorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Portador</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo portador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-portador-codigo">Código *</Label>
              <Input
                id="new-portador-codigo"
                value={newPortadorCodigo}
                onChange={(e) => setNewPortadorCodigo(e.target.value)}
                placeholder="Digite o código"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-portador-nome">Nome *</Label>
              <Input
                id="new-portador-nome"
                value={newPortadorNome}
                onChange={(e) => setNewPortadorNome(e.target.value)}
                placeholder="Digite o nome"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPortadorDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPortador} disabled={addingPortador}>
              {addingPortador ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar novo cliente */}
      <Dialog open={showClienteDialog} onOpenChange={setShowClienteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-cliente-codigo">Código (opcional)</Label>
              <Input
                id="new-cliente-codigo"
                value={newClienteCodigo}
                onChange={(e) => setNewClienteCodigo(e.target.value)}
                placeholder="Digite o código"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cliente-nome">Nome *</Label>
              <Input
                id="new-cliente-nome"
                value={newClienteNome}
                onChange={(e) => setNewClienteNome(e.target.value)}
                placeholder="Digite o nome"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClienteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCliente} disabled={addingCliente}>
              {addingCliente ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
