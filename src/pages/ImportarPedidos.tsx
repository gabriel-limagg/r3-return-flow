import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadZone } from '@/components/FileUploadZone';
import { ImportProgressBar } from '@/components/ImportProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  parseCSV,
  validateRow,
  downloadTemplate,
  type ParsedRow,
  type CSVRow,
} from '@/lib/csvParser';
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportResult {
  success: number;
  errors: Array<{ line: number; errors: string[] }>;
}

export default function ImportarPedidos() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult>({ success: 0, errors: [] });

  const handleFileSelect = async (file: File) => {
    try {
      toast.info('Lendo arquivo...');
      const parsed = await parseCSV(file);

      if (parsed.errors.length > 0) {
        toast.error('Erro ao ler arquivo CSV');
        return;
      }

      // Buscar portadores e clientes para matching
      const { data: portadores } = await supabase
        .from('portadores')
        .select('id, codigo, nome')
        .eq('ativo', true);

      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, codigo, nome')
        .eq('ativo', true);

      // Processar e validar cada linha
      const processedData: ParsedRow[] = parsed.data.map((row, index) => {
        const lineNumber = index + 2; // +2 porque linha 1 é header
        const validation = validateRow(row, lineNumber);

        // Matching de portador - extrair código se estiver no formato "004 - BRUNO RIBEIRO"
        let portador_id: string | undefined;
        if (row.portador) {
          // Tentar extrair código do formato "004 - NOME"
          const portadorMatch = row.portador.match(/^(\d+)\s*-\s*(.+)$/);
          const portadorCodigo = portadorMatch ? portadorMatch[1] : null;
          const portadorNome = portadorMatch ? portadorMatch[2].trim() : row.portador;

          const portador = portadores?.find((p) => {
            // Primeiro tentar por código exato
            if (portadorCodigo && p.codigo === portadorCodigo) return true;
            // Depois tentar por nome
            const pNome = p.nome.toLowerCase();
            const searchNome = portadorNome.toLowerCase();
            return pNome.includes(searchNome) || searchNome.includes(pNome);
          });
          portador_id = portador?.id;

          if (!portador_id && row.portador.trim()) {
            validation.warnings.push(`Portador "${row.portador}" não encontrado - será cadastrado sem portador`);
          }
        }

        // Matching de cliente - extrair código se estiver no formato "SP5814 - NATURA CABREUVA"
        let cliente_id: string | undefined;
        if (row.cliente) {
          // Tentar extrair código do formato "SP5814 - NOME"
          const clienteMatch = row.cliente.match(/^([A-Z0-9]+)\s*-\s*(.+)$/);
          const clienteCodigo = clienteMatch ? clienteMatch[1] : null;
          const clienteNome = clienteMatch ? clienteMatch[2].trim() : row.cliente;

          const cliente = clientes?.find((c) => {
            // Primeiro tentar por código exato
            if (clienteCodigo && c.codigo?.toUpperCase() === clienteCodigo.toUpperCase()) return true;
            // Depois tentar por nome
            const cNome = c.nome.toLowerCase();
            const searchNome = clienteNome.toLowerCase();
            return cNome.includes(searchNome) || searchNome.includes(cNome);
          });
          cliente_id = cliente?.id;

          if (!cliente_id && row.cliente.trim()) {
            validation.warnings.push(`Cliente "${row.cliente}" não encontrado - será cadastrado sem cliente`);
          }
        }

        return {
          ...row,
          lineNumber,
          validation,
          portador_id,
          cliente_id,
        };
      });

      setParsedData(processedData);
      setStep('preview');
      toast.success(`${processedData.length} linhas lidas com sucesso`);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    const validRows = parsedData.filter((row) => row.validation.isValid);
    setProgress({ current: 0, total: validRows.length });

    const errors: Array<{ line: number; errors: string[] }> = [];
    let successCount = 0;

    // Processar em lotes de 50
    const batchSize = 50;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);

      const insertData = batch.map((row) => {
        // Converter data brasileira para ISO - usar SEMPRE a data do CSV
        let dataCadastro: string;
        
        if (row.data_cadastro?.trim()) {
          const brDateMatch = row.data_cadastro.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
          if (brDateMatch) {
            const [, day, month, year, hour, minute] = brDateMatch;
            const hourStr = hour || '00';
            const minuteStr = minute || '00';
            dataCadastro = new Date(`${year}-${month}-${day}T${hourStr}:${minuteStr}:00`).toISOString();
          } else {
            // Se tem data mas não conseguiu parsear, lançar erro
            throw new Error(`Data inválida na linha ${row.lineNumber}: ${row.data_cadastro}`);
          }
        } else {
          // Se não tem data no CSV, usar data atual
          dataCadastro = new Date().toISOString();
        }

        return {
          pedido_codigo: row.pedido_codigo.trim(),
          romaneio: row.romaneio?.trim() || '',
          portador_id: row.portador_id || null,
          cliente_id: row.cliente_id || null,
          colaborador: row.colaborador?.trim() || '',
          base: row.base.toUpperCase(),
          status: row.status,
          data_cadastro: dataCadastro,
        };
      });

      const { data, error } = await supabase
        .from('pedidos_devolucao')
        .insert(insertData)
        .select();

      if (error) {
        batch.forEach((row) => {
          errors.push({
            line: row.lineNumber,
            errors: [error.message],
          });
        });
      } else {
        successCount += data?.length || 0;
      }

      setProgress({ current: i + batch.length, total: validRows.length });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Adicionar linhas inválidas aos erros
    parsedData
      .filter((row) => !row.validation.isValid)
      .forEach((row) => {
        errors.push({
          line: row.lineNumber,
          errors: row.validation.errors,
        });
      });

    setResult({ success: successCount, errors });
    setStep('complete');
    setImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} pedidos importados com sucesso!`);
    }
  };

  const validCount = parsedData.filter((r) => r.validation.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/pedidos')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Importar Pedidos</h1>
            <p className="text-muted-foreground">
              Importe múltiplos pedidos de uma vez usando arquivo CSV
            </p>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Selecione o arquivo CSV
              </CardTitle>
              <CardDescription>
                Faça upload do arquivo contendo os dados dos pedidos para importação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone onFileSelect={handleFileSelect} />

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template CSV
                </Button>
              </div>

              <div className="p-4 bg-accent/30 border border-border rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Formato esperado do CSV:
                </p>
                <code className="text-xs text-muted-foreground block">
                  pedido_codigo, romaneio, portador, cliente, colaborador, base, status
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  • Portador e Cliente podem ser código ou nome
                  <br />
                  • Base: SP, RJ ou MG
                  <br />• Status: A Devolver, Em processo de devolução, Devolvido
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Visualização dos Dados
              </CardTitle>
              <CardDescription>
                Revise os dados antes de importar. Linhas com erro não serão importadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-accent/30 border border-border rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{parsedData.length}</p>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  <p className="text-sm text-muted-foreground">Válidas</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                  <p className="text-sm text-muted-foreground">Com erro</p>
                </div>
              </div>

              {/* Data preview */}
              <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-accent/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium">Linha</th>
                      <th className="p-2 text-left font-medium">Pedido</th>
                      <th className="p-2 text-left font-medium">Romaneio</th>
                      <th className="p-2 text-left font-medium">Status</th>
                      <th className="p-2 text-left font-medium">Validação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 100).map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-2">{row.lineNumber}</td>
                        <td className="p-2">{row.pedido_codigo}</td>
                        <td className="p-2">{row.romaneio}</td>
                        <td className="p-2">
                          <Badge
                            variant={row.validation.isValid ? 'default' : 'destructive'}
                          >
                            {row.validation.isValid ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {row.validation.isValid ? 'OK' : 'Erro'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {!row.validation.isValid && (
                            <p className="text-xs text-red-600">
                              {row.validation.errors[0]}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.length > 100 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando primeiras 100 linhas de {parsedData.length}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {validCount} Pedidos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <Card>
            <CardHeader>
              <CardTitle>Importando Pedidos...</CardTitle>
              <CardDescription>
                Aguarde enquanto os pedidos são processados e inseridos no banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportProgressBar
                current={progress.current}
                total={progress.total}
                status="Inserindo pedidos em lotes"
              />
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Importação Concluída!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{result.success}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pedidos importados com sucesso
                  </p>
                </div>
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Linhas com erro</p>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Erros Encontrados:
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {result.errors.slice(0, 20).map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                      >
                        <p className="text-sm font-medium text-red-600">
                          Linha {error.line}:
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                          {error.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Mostrando primeiros 20 erros de {result.errors.length}
                    </p>
                  )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                  Importar Mais Pedidos
                </Button>
                <Button onClick={() => navigate('/pedidos')} className="flex-1">
                  Voltar para Pedidos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
