type LogLevel = 'info' | 'warn' | 'error';

function emit(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
  const entry = { level, msg, ts: new Date().toISOString(), ...ctx };
  const line = JSON.stringify(entry);
  switch (level) {
    case 'error': console.error(line); break;
    case 'warn':  console.warn(line);  break;
    default:      console.log(line);
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
};
