import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ComboboxSearchable, ComboboxOption } from "@/components/ComboboxSearchable";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import logoPrincipal from "@/assets/logo-principal.png";

export default function EditarPedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [pedidoCodigo, setPedidoCodigo] = useState("");
  const [romaneio, setRomaneio] = useState("");
  const [portadorId, setPortadorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [base, setBase] = useState("SP");
  const [status, setStatus] = useState("A Devolver");
  const [dataCadastro, setDataCadastro] = useState("");
  const [observacao, setObservacao] = useState("");

  const [portadores, setPortadores] = useState<ComboboxOption[]>([]);
  const [clientes, setClientes] = useState<ComboboxOption[]>([]);

  // Estados para diálogos de novo portador/cliente
  const [showPortadorDialog, setShowPortadorDialog] = useState(false);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newPortadorCodigo, setNewPortadorCodigo] = useState("");
  const [newPortadorNome, setNewPortadorNome] = useState("");
  const [newClienteCodigo, setNewClienteCodigo] = useState("");
  const [newClienteNome, setNewClienteNome] = useState("");
  const [addingPortador, setAddingPortador] = useState(false);
  const [addingCliente, setAddingCliente] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPortadores();
    loadClientes();
    loadPedido();
  }, [id]);

  const loadPedido = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("pedidos_devolucao")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Erro ao carregar pedido",
        description: error.message,
        variant: "destructive",
      });
      navigate("/pedidos");
      return;
    }

    setPedidoCodigo(data.pedido_codigo);
    setRomaneio(data.romaneio);
    setPortadorId(data.portador_id || "");
    setClienteId(data.cliente_id || "");
    setColaborador(data.colaborador);
    setBase(data.base);
    setStatus(data.status);
    setDataCadastro(data.data_cadastro);
    setObservacao(data.observacao || "");
    setLoadingData(false);
  };

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

    const { error } = await supabase
      .from("pedidos_devolucao")
      .update({
        pedido_codigo: pedidoCodigo,
        romaneio,
        portador_id: portadorId || null,
        cliente_id: clienteId || null,
        colaborador,
        base,
        status,
        observacao: observacao || null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar pedido",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Pedido atualizado com sucesso.",
      });
      navigate("/pedidos");
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("pedidos_devolucao")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir pedido",
        description: error.message,
        variant: "destructive",
      });
      setDeleting(false);
    } else {
      toast({
        title: "Sucesso!",
        description: "Pedido excluído com sucesso.",
      });
      navigate("/pedidos");
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

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
            <CardTitle>Editar Pedido de Devolução</CardTitle>
            <CardDescription>Atualize os dados do pedido abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pedido-codigo">Pedido (Código)</Label>
                  <Input
                    id="pedido-codigo"
                    value={pedidoCodigo}
                    onChange={(e) => setPedidoCodigo(e.target.value)}
                    placeholder="Digite o código do pedido"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="romaneio">Romaneio</Label>
                  <Input
                    id="romaneio"
                    value={romaneio}
                    onChange={(e) => setRomaneio(e.target.value)}
                    placeholder="Digite o romaneio"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Portador</Label>
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
                  <Label>Cliente</Label>
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
                  <Label htmlFor="colaborador">Colaborador</Label>
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
                  <Label htmlFor="base">Base</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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

                <div className="space-y-2">
                  <Label>Data de Cadastro</Label>
                  <Input
                    value={format(new Date(dataCadastro), "dd/MM/yyyy HH:mm")}
                    disabled
                    className="h-11 bg-muted"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Digite observações sobre o pedido (opcional)"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/pedidos")}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-11"
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
