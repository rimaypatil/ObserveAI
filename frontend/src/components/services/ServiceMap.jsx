import React, { useState } from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { initialServiceGraph } from '@/mocks/serviceMapMock';
import { Server, ShieldAlert } from 'lucide-react';

export const ServiceMap = ({ realServices = [] }) => {
  const [nodes, setNodes] = useState(initialServiceGraph.nodes);
  const [edges, setEdges] = useState(initialServiceGraph.edges);

  return (
    <div className="h-[450px] w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-900 overflow-hidden relative shadow-sm">
      <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <Server className="w-4 h-4 text-brand-400" />
          Service Architecture Map
        </div>
        <p className="text-[10px] text-slate-400">
          Interactive topology graph displaying latency dependencies & health status.
        </p>
      </div>

      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
