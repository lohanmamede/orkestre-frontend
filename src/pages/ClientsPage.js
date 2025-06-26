import React from 'react';
import Card from '../components/common/Card';
import Container from '../components/common/Container';

const ClientsPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <Container>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Clientes</h1>
        
        <div className="mb-8">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Gerenciamento de Clientes</h2>
              <p className="text-gray-600 mb-4">Este módulo está em desenvolvimento. Em breve você poderá gerenciar todos os seus clientes, visualizar históricos de atendimentos e personalizar o relacionamento com cada um deles.</p>
              <div className="flex justify-center items-center h-60 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Funcionalidade em construção</p>
                  <p className="text-sm text-gray-400">Em breve você poderá:</p>
                  <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                    <li>Cadastrar e gerenciar clientes</li>
                    <li>Visualizar histórico de atendimentos</li>
                    <li>Realizar comunicações personalizadas</li>
                    <li>Gerenciar preferências e observações</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ClientsPage;
