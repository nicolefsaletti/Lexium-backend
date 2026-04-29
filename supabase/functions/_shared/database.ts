import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at?: string;
};

type UpdateClient = Partial<Pick<Client, 'name' | 'email'>>;

type ApiResponse<T = null> = {
  data: T | null;
  error: string | null;
};

function getErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido.';

  const code = error.code;

  switch (code) {
    case 'PGRST116':
      return 'Recurso não encontrado.';
    case 'PGRST105':
    case '23505':
      return 'Violação de restrição de unicidade.';
    case '42501':
      return 'Permissão insuficiente.';
    default:
      console.error('Erro Supabase:', error);
      return error.message || 'Erro no banco de dados.';
  }
}

export async function criarCliente(userId: string, name: string, email: string): Promise<ApiResponse<Client>> {
  // Verificar duplicata por email para o usuário
  const { data: existing, error: checkError } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('email', email)
    .maybeSingle();

  if (checkError) {
    return { data: null, error: getErrorMessage(checkError) };
  }

  if (existing) {
    return { data: null, error: 'Cliente com este email já existe para este usuário.' };
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name, email })
    .select()
    .single();

  if (error) {
    return { data: null, error: getErrorMessage(error) };
  }

  return { data: data!, error: null };
}

export async function listarClientes(userId: string): Promise<ApiResponse<Client[]>> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: getErrorMessage(error) };
  }

  return { data: data || [], error: null };
}

export async function deletarCliente(userId: string, clientId: string): Promise<ApiResponse<null>> {
  const { data: deletedData, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId)
    .select();

  if (error) {
    return { data: null, error: getErrorMessage(error) };
  }

  if (!deletedData || deletedData.length === 0) {
    return { data: null, error: 'Cliente não encontrado ou não pertence ao usuário.' };
  }

  return { data: null, error: null };
}

export async function atualizarCliente(userId: string, clientId: string, updates: UpdateClient): Promise<ApiResponse<Client>> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .eq('user_id', userId)
    .select();

  if (error) {
    return { data: null, error: getErrorMessage(error) };
  }

  if (!data || data.length === 0) {
    return { data: null, error: 'Cliente não encontrado ou não pertence ao usuário.' };
  }

  return { data: data[0], error: null };
}
