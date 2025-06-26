import React from 'react';
import Card from '../components/common/Card';
import Container from '../components/common/Container';

const ConfigPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <Container>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Configurações do Sistema</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Perfil do Estabelecimento</h2>
              <p className="text-gray-600 mb-4">Informações gerais do seu negócio.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Usuários</h2>
              <p className="text-gray-600 mb-4">Gerencie as contas e permissões.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Integrações</h2>
              <p className="text-gray-600 mb-4">Conecte com outros sistemas.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Notificações</h2>
              <p className="text-gray-600 mb-4">Configure as notificações do sistema.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Personalização</h2>
              <p className="text-gray-600 mb-4">Personalize a aparência do sistema.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Backup</h2>
              <p className="text-gray-600 mb-4">Gerencie backups dos seus dados.</p>
              <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Módulo em desenvolvimento</p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ConfigPage;
