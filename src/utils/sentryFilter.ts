/**
 * Filtro de Sentry para el frontend que sanitiza datos sensibles
 * Similar al del backend pero adaptado para el navegador
 */

interface SensitiveDataPatterns {
  password: RegExp;
  token: RegExp;
  email: RegExp;
  phone: RegExp;
  creditCard: RegExp;
  ssn: RegExp;
  apiKey: RegExp;
  secret: RegExp;
  authorization: RegExp;
  cookie: RegExp;
}

const SENSITIVE_PATTERNS: SensitiveDataPatterns = {
  password: /password["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
  token: /(token|access_token|refresh_token|jwt)["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  apiKey: /(api[_-]?key|apikey)["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
  secret: /(secret|client_secret|private_key)["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
  authorization: /authorization["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
  cookie: /cookie["\s]*[:=]["\s]*([^"\s,\]}]+)/gi,
};

/**
 * Sanitiza un string reemplazando datos sensibles
 */
function sanitizeString(str: string): string {
  let sanitized = str;
  
  // Reemplazar contraseñas y tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, 'password=[REDACTED]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.token, '$1=[REDACTED]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.apiKey, '$1=[REDACTED]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.secret, '$1=[REDACTED]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.authorization, 'authorization=[REDACTED]');
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cookie, 'cookie=[REDACTED]');
  
  // Sanitizar emails (mantener dominio)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, (match) => {
    const [username, domain] = match.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(Math.max(0, username.length - 2)) + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  });
  
  // Sanitizar números de tarjeta de crédito
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '[CREDIT_CARD_REDACTED]');
  
  // Sanitizar SSN
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.ssn, '[SSN_REDACTED]');
  
  // Sanitizar números de teléfono (mantener últimos 4 dígitos)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-***-${digits.slice(-4)}`;
    }
    return '[PHONE_REDACTED]';
  });
  
  return sanitized;
}

/**
 * Sanitiza un objeto o string, reemplazando datos sensibles con [REDACTED]
 */
function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (typeof data === 'object' && data !== null) {
    return sanitizeObject(data);
  }
  
  return data;
}

/**
 * Sanitiza un objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Campos que deben ser completamente redactados
    if (lowerKey.includes('password') || 
        lowerKey.includes('token') || 
        lowerKey.includes('secret') || 
        lowerKey.includes('apikey') || 
        lowerKey.includes('private_key') ||
        lowerKey.includes('client_secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')) {
      sanitized[key] = '[REDACTED]';
    }
    // Sanitizar emails
    else if (lowerKey.includes('email') && typeof value === 'string') {
      const [username, domain] = value.split('@');
      if (username && domain) {
        const maskedUsername = username.charAt(0) + '*'.repeat(Math.max(0, username.length - 2)) + username.slice(-1);
        sanitized[key] = `${maskedUsername}@${domain}`;
      } else {
        sanitized[key] = value;
      }
    }
    // Sanitizar teléfonos
    else if (lowerKey.includes('phone') && typeof value === 'string') {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 4) {
        sanitized[key] = `***-***-${digits.slice(-4)}`;
      } else {
        sanitized[key] = '[PHONE_REDACTED]';
      }
    }
    // Sanitizar tarjetas de crédito
    else if (lowerKey.includes('credit_card') || lowerKey.includes('card_number')) {
      sanitized[key] = '[CREDIT_CARD_REDACTED]';
    }
    // Sanitizar SSN
    else if (lowerKey.includes('ssn') || lowerKey.includes('social_security')) {
      sanitized[key] = '[SSN_REDACTED]';
    }
    // Recursivamente sanitizar objetos y arrays
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    }
    // Sanitizar cualquier string restante usando las reglas generales
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Filtro de Sentry para el frontend
 * Configuración de beforeSend para sanitizar datos sensibles
 */
export const sentryFilter = {
  beforeSend(event: any) {
    try {
      // Sanitizar el evento completo
      if (event.exception) {
        event.exception = sanitizeForLogging(event.exception);
      }
      
      if (event.message) {
        event.message = sanitizeString(event.message);
      }
      
      if (event.extra) {
        event.extra = sanitizeForLogging(event.extra);
      }
      
      if (event.contexts) {
        event.contexts = sanitizeForLogging(event.contexts);
      }
      
      // Sanitizar request si existe
      if (event.request?.headers) {
        event.request.headers = sanitizeForLogging(event.request.headers);
      }
      
      if (event.request?.data) {
        event.request.data = sanitizeForLogging(event.request.data);
      }
      
      // Sanitizar breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
          if (breadcrumb.message) {
            breadcrumb.message = sanitizeString(breadcrumb.message);
          }
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeForLogging(breadcrumb.data);
          }
          return breadcrumb;
        });
      }
      
      return event;
    } catch (error) {
      console.error('Error al sanitizar evento de Sentry:', error);
      return event; // Devolver el evento original si hay error en la sanitización
    }
  }
};

export default sentryFilter;