import React from 'react';
import { PartyPopper } from 'lucide-react';
import GlassCard from '../../ui/GlassCard';

const DataManagementContent: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Limpeza de Dados</h1>
      
      <GlassCard className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Tudo em ordem!</h2>
          <p className="text-gray-600 mt-2 max-w-md">
            A limpeza de dados legados foi concluída com sucesso. Não há mais ações pendentes nesta seção.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default DataManagementContent;
