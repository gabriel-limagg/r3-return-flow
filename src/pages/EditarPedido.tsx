import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComboboxSearchable, ComboboxOption } from "@/components/ComboboxSearchable";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
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

  const [portadores, setPortadores] = useState<ComboboxOption[]>([]);
  const [clientes, setClientes] = useState<ComboboxOption[]>([]);

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
    setPortadorId(data.portador_id);
    setClienteId(data.cliente_id);
    setColaborador(data.colaborador);
    setBase(data.base);
    setStatus(data.status);
    setDataCadastro(data.data_cadastro);
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

    const { error } = await supabase
      .from("pedidos_devolucao")
      .update({
        pedido_codigo: pedidoCodigo,
        romaneio,
        portador_id: portadorId,
        cliente_id: clienteId,
        colaborador,
        base,
        status,
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colaborador">Colaborador *</Label>
                  <Input
                    id="colaborador"
                    value={colaborador}
                    onChange={(e) => setColaborador(e.target.value)}
                    placeholder="Nome do colaborador"
                    required
                    className="h-11"
                  />
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

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Data de Cadastro</Label>
                  <Input
                    value={format(new Date(dataCadastro), "dd/MM/yyyy HH:mm")}
                    disabled
                    className="h-11 bg-muted"
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
