import React from 'react';
import Card from '../components/common/Card';
import Container from '../components/common/Container';

const ReportsPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <Container>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Relatórios</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Vendas Diárias</h2>
              <p className="text-gray-600 mb-4">Visualize as vendas realizadas por dia.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Relatório em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Serviços Mais Vendidos</h2>
              <p className="text-gray-600 mb-4">Análise dos serviços mais populares.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Relatório em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Desempenho de Profissionais</h2>
              <p className="text-gray-600 mb-4">Avalie o desempenho da sua equipe.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Relatório em desenvolvimento</p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ReportsPage;
