import { z } from 'zod'

type TipoCliente = 'PF' | 'PJ';
const tipoClienteSchema = z.enum(['PF', 'PJ'], {
  errorMap: () => ({ message: 'Tipo de cliente deve ser PF ou PJ' }),
});

type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viúvo';
const estadoCivilSchema = z.enum(['solteiro', 'casado', 'divorciado', 'viúvo'], {
  errorMap: () => ({ message: 'Estado civil inválido' }),
});

type TipoRelacionamento = 'cliente' | 'fornecedor' | 'parceiro';
const tipoRelacionamentoSchema = z.enum(['cliente', 'fornecedor', 'parceiro'], {
  errorMap: () => ({ message: 'Tipo de relacionamento inválido' }),
});

const cpfCnpjRegex = /^(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})$/;
const telefoneRegex = /^[(]?\d{2}[)]?[- \s]?[9]?\d{4}[- \s]?\d{4}$/;

function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf.charAt(10));
}

function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit = remainder < 2 ? 0 : 11 - remainder;
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  digit = remainder < 2 ? 0 : 11 - remainder;
  return digit === parseInt(cnpj.charAt(13));
}

export const clienteSchema = z
  .object({
    nome: z
      .string()
      .min(3, 'O nome deve ter pelo menos 3 caracteres.')
      .max(255, 'O nome deve ter no máximo 255 caracteres.'),
    email: z.string().email('Email inválido.').optional(),
    telefone: z
      .string()
      .regex(telefoneRegex, 'Telefone no formato brasileiro inválido (ex: (11) 99999-9999).')
      .optional(),
    tipo_cliente: tipoClienteSchema,
    estado_civil: estadoCivilSchema,
    tipo_relacionamento: tipoRelacionamentoSchema,
    cpf_cnpj: z
      .string()
      .min(11, 'CPF/CNPJ deve ter pelo menos 11 caracteres.')
      .max(18, 'CPF/CNPJ deve ter no máximo 18 caracteres.')
      .regex(cpfCnpjRegex, 'Formato de CPF/CNPJ inválido.'),
  })
  .superRefine((data: z.infer<typeof clienteSchema>, ctx: z.RefinementCtx) => {
    if (data.tipo_cliente === 'PF') {
      if (!validateCPF(data.cpf_cnpj)) {
        ctx.addIssue({
          code: 'custom',
          message: 'CPF inválido.',
          path: ['cpf_cnpj'],
        });
      }
    } else {
      if (!validateCNPJ(data.cpf_cnpj)) {
        ctx.addIssue({
          code: 'custom',
          message: 'CNPJ inválido.',
          path: ['cpf_cnpj'],
        });
      }
    }
  });

export type Cliente = z.infer<typeof clienteSchema>;