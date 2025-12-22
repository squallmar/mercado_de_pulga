'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrackingEvent {
  date: string;
  description: string;
  location?: string;
}

interface ShippingTracking {
  tracking_code: string;
  status: string;
  method: string;
  events: TrackingEvent[];
}

interface ShippingTrackingPanelProps {
  shipmentId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
  label_generated: { label: 'Etiqueta Gerada', color: 'bg-blue-100 text-blue-800' },
  posted: { label: 'Postado', color: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: 'Em Trânsito', color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  ready_for_pickup: { label: 'Pronto para Retirada', color: 'bg-blue-100 text-blue-800' },
  picked_up: { label: 'Retirado', color: 'bg-green-100 text-green-800' },
  meeting_scheduled: { label: 'Encontro Agendado', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
};

const methodLabels: Record<string, string> = {
  carrier: 'Transportadora',
  local_pickup: 'Retirada Local',
  local_meeting: 'Encontro Presencial',
};

export default function ShippingTrackingPanel({ 
  shipmentId, 
  autoRefresh = false, 
  refreshInterval = 60 
}: ShippingTrackingPanelProps) {
  const [tracking, setTracking] = useState<ShippingTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTracking = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipping/${shipmentId}/tracking`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar rastreamento');
      }

      const data = await response.json();
      setTracking(data);
      setError('');
    } catch (err) {
      setError('Não foi possível carregar o rastreamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchTracking();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchTracking, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [shipmentId, autoRefresh, refreshInterval, fetchTracking]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Rastreamento não disponível'}</p>
          <button
            onClick={fetchTracking}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[tracking.status] || { label: tracking.status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rastreamento de Envio</h3>
          <p className="text-sm text-gray-500 mt-1">
            Método: {methodLabels[tracking.method] || tracking.method}
          </p>
        </div>
        <button
          onClick={fetchTracking}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Atualizar rastreamento"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Status Atual */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status Atual</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Código de Rastreamento</p>
            <p className="font-mono font-semibold text-gray-900">{tracking.tracking_code}</p>
          </div>
        </div>
      </div>

      {/* Timeline de Eventos */}
      {tracking.events && tracking.events.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Histórico de Movimentação</h4>
          <div className="space-y-4">
            {tracking.events.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  {index < tracking.events.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className={`font-medium ${index === 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                      {event.description}
                    </p>
                    <p className="text-sm text-gray-500 ml-4">
                      {new Date(event.date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {event.location && (
                    <p className="text-sm text-gray-600">📍 {event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!tracking.events || tracking.events.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>Nenhuma movimentação registrada ainda</p>
        </div>
      )}

      {autoRefresh && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Atualização automática a cada {refreshInterval} segundos
          </p>
        </div>
      )}
    </div>
  );
}
