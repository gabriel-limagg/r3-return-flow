import Papa from 'papaparse';

export interface CSVRow {
  pedido_codigo: string;
  romaneio: string;
  portador: string;
  cliente: string;
  colaborador: string;
  base: string;
  status: string;
  data_cadastro?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedRow extends CSVRow {
  lineNumber: number;
  validation: ValidationResult;
  portador_id?: string;
  cliente_id?: string;
}

const VALID_BASES = ['SP', 'RJ', 'MG'];
const VALID_STATUS = ['A Devolver', 'Em processo de devolução', 'Devolvido'];

const headerMapping: Record<string, string> = {
  'id': 'id',
  'data_de_criação': 'data_cadastro',
  'pedido': 'pedido_codigo',
  'portador': 'portador',
  'romaneio': 'romaneio',
  'colaborador': 'colaborador',
  'base': 'base',
  'status': 'status',
  'cliente': 'cliente',
  'modificado': 'updated_at',
};

export const parseCSV = (file: File): Promise<Papa.ParseResult<CSVRow>> => {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Mapear headers para o formato esperado
        const mappedData = results.data.map((row: any) => {
          const mappedRow: any = {};
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            const mappedKey = headerMapping[normalizedKey] || normalizedKey;
            mappedRow[mappedKey] = row[key]?.trim() || '';
          });
          return mappedRow as CSVRow;
        });
        resolve({ ...results, data: mappedData });
      },
      error: reject,
    });
  });
};

export const validateRow = (row: CSVRow, lineNumber: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // CAMPOS OBRIGATÓRIOS: apenas pedido, status e data
  if (!row.pedido_codigo?.trim()) {
    errors.push('Código do pedido é obrigatório');
  }

  // Validar status (obrigatório)
  if (!row.status?.trim()) {
    errors.push('Status é obrigatório');
  } else if (!VALID_STATUS.includes(row.status)) {
    errors.push(`Status inválido. Use: ${VALID_STATUS.join(', ')}`);
  }

  // Validar data (obrigatória)
  if (!row.data_cadastro?.trim()) {
    errors.push('Data de cadastro é obrigatória');
  } else {
    const brDateMatch = row.data_cadastro.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (brDateMatch) {
      const day = parseInt(brDateMatch[1]);
      const month = parseInt(brDateMatch[2]);
      const year = parseInt(brDateMatch[3]);
      const hour = brDateMatch[4] ? parseInt(brDateMatch[4]) : 0;
      const minute = brDateMatch[5] ? parseInt(brDateMatch[5]) : 0;
      
      const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
      if (isNaN(date.getTime())) {
        errors.push('Data de cadastro em formato inválido');
      }
    } else {
      errors.push('Data de cadastro em formato inválido (use dd/MM/yyyy HH:mm)');
    }
  }
  
  // CAMPOS OPCIONAIS - apenas avisos
  if (!row.romaneio?.trim()) {
    warnings.push('Romaneio não informado');
  }
  
  if (!row.portador?.trim()) {
    warnings.push('Portador não informado');
  }
  
  if (!row.cliente?.trim()) {
    warnings.push('Cliente não informado');
  }
  
  if (!row.colaborador?.trim()) {
    warnings.push('Colaborador não informado');
  }

  if (!row.base?.trim()) {
    warnings.push('Base não informada');
  } else if (!VALID_BASES.includes(row.base.toUpperCase())) {
    warnings.push(`Base inválida. Use: ${VALID_BASES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const generateCSVTemplate = (): string => {
  const headers = [
    'Pedido',
    'Romaneio',
    'Portador',
    'Cliente',
    'Colaborador',
    'Base',
    'Status',
    'Data_de_Criação',
  ];

  const examples = [
    [
      '3634759652',
      '185615',
      '004 - BRUNO RIBEIRO - CARRO',
      'SP5814 - NATURA CABREUVA',
      'ARIELY',
      'SP',
      'Devolvido',
      '01/10/2025 11:50',
    ],
    [
      '3629416714',
      '185618',
      '1033 - RAFAEL GRECCO CANTALEJO',
      'LOG MANAGER LTDA 1169',
      'LARYSSA',
      'RJ',
      'Em processo de devolução',
      '02/10/2025 10:30',
    ],
  ];

  const csv = [headers, ...examples]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csv;
};

export const downloadTemplate = () => {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'template_importacao_pedidos.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
