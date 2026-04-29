import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UsuarioAutenticado {
  user_id: string;
}

export interface RespostaErro {
  error: string;
  message: string;
  status: number;
}

export function extrairJWT(headers: Headers): string | null {
  const authorization = headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice(7).trim();
}

export async function validarJWT(token: string): Promise<UsuarioAutenticado | RespostaErro> {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      error: 'TOKEN_INVALIDO',
      message: 'Token JWT inválido ou expirado.',
      status: 401
    };
  }

  return {
    user_id: user.id
  };
}

export async function verificarAcessoCliente(userId: string, clientId: string): Promise<boolean | RespostaErro> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return {
      error: 'ERRO_VERIFICACAO_ACESSO',
      message: 'Erro ao verificar acesso ao cliente.',
      status: 500
    };
  }

  return !!data;
}