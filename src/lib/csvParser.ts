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

export const parseCSV = (file: File): Promise<Papa.ParseResult<CSVRow>> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: resolve,
      error: reject,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });
  });
};

export const validateRow = (row: CSVRow, lineNumber: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Campos obrigatórios
  if (!row.pedido_codigo?.trim()) {
    errors.push('Código do pedido é obrigatório');
  }
  if (!row.romaneio?.trim()) {
    errors.push('Romaneio é obrigatório');
  }
  if (!row.portador?.trim()) {
    errors.push('Portador é obrigatório');
  }
  if (!row.cliente?.trim()) {
    errors.push('Cliente é obrigatório');
  }
  if (!row.colaborador?.trim()) {
    errors.push('Colaborador é obrigatório');
  }

  // Validar base
  if (!row.base?.trim()) {
    errors.push('Base é obrigatória');
  } else if (!VALID_BASES.includes(row.base.toUpperCase())) {
    errors.push(`Base inválida. Use: ${VALID_BASES.join(', ')}`);
  }

  // Validar status
  if (!row.status?.trim()) {
    errors.push('Status é obrigatório');
  } else if (!VALID_STATUS.includes(row.status)) {
    errors.push(`Status inválido. Use: ${VALID_STATUS.join(', ')}`);
  }

  // Validar data (se fornecida)
  if (row.data_cadastro?.trim()) {
    const date = new Date(row.data_cadastro);
    if (isNaN(date.getTime())) {
      errors.push('Data de cadastro em formato inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const generateCSVTemplate = (): string => {
  const headers = [
    'pedido_codigo',
    'romaneio',
    'portador',
    'cliente',
    'colaborador',
    'base',
    'status',
    'data_cadastro',
  ];

  const examples = [
    [
      'PED001',
      'ROM001',
      'PORT001',
      'CLI001',
      'João Silva',
      'SP',
      'A Devolver',
      '2024-01-15 10:00:00',
    ],
    [
      'PED002',
      'ROM002',
      'Portador SP01',
      'NATURA CABREUVA',
      'Maria Santos',
      'RJ',
      'Em processo de devolução',
      '',
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
