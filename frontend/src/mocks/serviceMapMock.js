export const initialServiceGraph = {
  nodes: [
    {
      id: 'api-gateway',
      type: 'default',
      data: { label: 'API Gateway (Healthy • 42ms)' },
      position: { x: 250, y: 50 },
      style: { background: '#00796B', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
    },
    {
      id: 'payment-service',
      type: 'default',
      data: { label: 'Payment Service (Degraded • 4.2s)' },
      position: { x: 100, y: 180 },
      style: { background: '#D32F2F', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
    },
    {
      id: 'order-service',
      type: 'default',
      data: { label: 'Order Service (Healthy • 85ms)' },
      position: { x: 400, y: 180 },
      style: { background: '#00796B', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
    },
    {
      id: 'database-cluster',
      type: 'default',
      data: { label: 'PostgreSQL Cluster (Pool 98%)' },
      position: { x: 250, y: 310 },
      style: { background: '#F57C00', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'api-gateway', target: 'payment-service', animated: true, style: { stroke: '#D32F2F', strokeWidth: 2 } },
    { id: 'e1-3', source: 'api-gateway', target: 'order-service', animated: true, style: { stroke: '#00796B', strokeWidth: 2 } },
    { id: 'e2-4', source: 'payment-service', target: 'database-cluster', animated: true, style: { stroke: '#D32F2F', strokeWidth: 2 } },
    { id: 'e3-4', source: 'order-service', target: 'database-cluster', animated: false, style: { stroke: '#00796B', strokeWidth: 2 } },
  ],
};
