'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log full error to console to aid debugging in dev
    console.error('[GlobalErrorBoundary]', error);
  }, [error]);

  const message = (error && (error.message || String(error))) || 'Erro desconhecido';
  const stack = error?.stack;

  return (
    <html>
      <body className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-6">
        <div className="max-w-2xl mx-auto vintage-card p-6">
          <h2 className="font-vintage-subtitle text-2xl mb-2" style={{ color: '#3C3C3C' }}>
            Opa, algo deu errado
          </h2>
          <p className="font-vintage-body text-[#6B4C57] mb-4">
            Houve um erro ao renderizar esta página. Você pode tentar novamente.
          </p>
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
            <div className="text-sm break-words">
              <strong>Mensagem:</strong> {message}
            </div>
            {error?.digest && (
              <div className="text-xs mt-1 opacity-80">
                <strong>Digest:</strong> {error.digest}
              </div>
            )}
          </div>
          {stack && (
            <details className="mb-4">
              <summary className="cursor-pointer font-vintage-body text-sm" style={{ color: '#8B6F47' }}>
                Detalhes técnicos (stack)
              </summary>
              <pre className="mt-2 p-3 bg-white rounded-md overflow-auto text-xs">
                {stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => reset()}
            className="vintage-button px-4 py-2"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
