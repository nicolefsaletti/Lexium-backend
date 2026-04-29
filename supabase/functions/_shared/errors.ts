interface SupabaseError extends Record<string, unknown> {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

function isSupabaseError(error: unknown): error is SupabaseError {
  if (typeof error !== 'object' || error === null || Array.isArray(error)) {
    return false;
  }
  const err = error as Record<string, unknown>;
  return typeof err.message === 'string' &&
         (typeof err.code === 'string' || 'code' in err === false) &&
         (!err.details || typeof err.details === 'string') &&
         (!err.hint || typeof err.hint === 'string');
}

class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message?: string) {
    super(message || 'Erro de validação');
  }
}

class AuthenticationError extends AppError {
  constructor(message?: string) {
    super(message || 'Erro de autenticação');
  }
}

class AuthorizationError extends AppError {
  constructor(message?: string) {
    super(message || 'Erro de autorização');
  }
}

class DatabaseError extends AppError {
  code?: string;
  details?: string;

  constructor(message?: string, code?: string, details?: string) {
    super(message || 'Erro de banco de dados');
    this.code = code;
    this.details = details;
  }
}

function fromSupabaseError(error: unknown): AppError {
  if (!isSupabaseError(error)) {
    throw new AppError('Não é um erro do Supabase');
  }

  const { message, code, details } = error;

  // Mapeamento baseado em códigos ou mensagens comuns do Supabase
  if (code?.startsWith('PGRST') || code?.startsWith('235') || code === 'P0001') {
    return new DatabaseError(message, code, details);
  } else if (code === '422' || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('validaç')) {
    return new ValidationError(message);
  } else if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('login') || message.toLowerCase().includes('credential')) {
    return new AuthenticationError(message);
  } else if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('authorization') || message.toLowerCase().includes('acesso negado')) {
    return new AuthorizationError(message);
  } else {
    return new DatabaseError(message, code, details);
  }
}

export type { SupabaseError };
export {
  isSupabaseError,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  fromSupabaseError
};