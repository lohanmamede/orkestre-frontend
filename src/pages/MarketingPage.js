import React from 'react';
import Card from '../components/common/Card';
import Container from '../components/common/Container';

const MarketingPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <Container>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Marketing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Campanhas</h2>
              <p className="text-gray-600 mb-4">Gerencie suas campanhas de marketing.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">E-mails</h2>
              <p className="text-gray-600 mb-4">Crie e envie e-mails promocionais.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Marketing Digital</h2>
            <p className="text-gray-600 mb-4">
              Este módulo está em desenvolvimento. Em breve você poderá criar e gerenciar 
              campanhas de marketing para aumentar o alcance do seu estabelecimento e 
              fidelizar seus clientes.
            </p>
            <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-400 mt-2">Em breve você poderá:</p>
                <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                  <li>Enviar mensagens automáticas de confirmação</li>
                  <li>Criar campanhas promocionais</li>
                  <li>Gerenciar lembretes de agendamentos</li>
                  <li>Enviar ofertas personalizadas</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default MarketingPage;
