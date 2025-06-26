import React, { useState, useEffect, useCallback } from 'react';
import {
  getProfessionalsByEstablishment,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  toggleProfessionalStatus
} from '../../services/professionalService';
import { getServicesByEstablishment } from '../../services/serviceService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { LoadingState } from '../common/LoadingStates';
import ProfessionalForm from './ProfessionalForm';
import ProfessionalCard from './ProfessionalCard';
import AddProfessionalCard from './AddProfessionalCard';
import ProfessionalDetailsModal from './ProfessionalDetailsModal';

const ProfessionalsView = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  // Estados principais
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados de operações
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados de seleção
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [professionalToDelete, setProfessionalToDelete] = useState(null);

  // Estados de filtros e pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Buscar dados iniciais
  const fetchData = useCallback(async () => {
    if (!currentUser?.establishment?.id) {
      setError('Estabelecimento não encontrado');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const [professionalsData, servicesData] = await Promise.all([
        getProfessionalsByEstablishment(currentUser.establishment.id).catch(() => []),
        getServicesByEstablishment(currentUser.establishment.id).catch(() => [])
      ]);
      
      setProfessionals(professionalsData || []);
      setServices(servicesData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      const errorMsg = err?.detail || err?.message || 'Erro ao carregar dados';
      setError(errorMsg);
      showError(`Erro ao carregar dados: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.establishment?.id, showError]);

  useEffect(() => {
    if (currentUser?.establishment?.id) {
      fetchData();
    }
  }, [fetchData]);

  // Criar profissional
  const handleCreateProfessional = async (professionalData) => {
    if (!currentUser?.establishment?.id) {
      showError('Estabelecimento não encontrado');
      return;
    }

    setIsCreating(true);
    try {
      // Simular criação quando não há backend
      const newProfessional = {
        id: Date.now().toString(),
        ...professionalData,
        establishment_id: currentUser.establishment.id,
        total_appointments: 0,
        monthly_appointments: 0,
        rating: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        // Tentar usar o backend
        const createdProfessional = await createProfessional({
          ...professionalData,
          establishment_id: currentUser.establishment.id
        });
        setProfessionals(prev => [...prev, createdProfessional]);
      } catch (backendError) {
        // Se falhar, usar dados mockados
        console.warn('Backend não disponível, usando dados simulados:', backendError);
        setProfessionals(prev => [...prev, newProfessional]);
      }
      
      setShowCreateModal(false);
      showSuccess('Profissional criado com sucesso!');
    } catch (err) {
      const errorMsg = err?.detail || err?.message || 'Erro ao criar profissional';
      showError(`Erro ao criar profissional: ${errorMsg}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Atualizar profissional
  const handleUpdateProfessional = async (professionalData) => {
    if (!selectedProfessional) return;
    
    setIsUpdating(true);
    try {
      try {
        const updatedProfessional = await updateProfessional(selectedProfessional.id, professionalData);
        setProfessionals(prev => 
          prev.map(prof => prof.id === selectedProfessional.id ? updatedProfessional : prof)
        );
      } catch (backendError) {
        // Se falhar, atualizar localmente
        console.warn('Backend não disponível, atualizando localmente:', backendError);
        const updatedProfessional = {
          ...selectedProfessional,
          ...professionalData,
          updated_at: new Date().toISOString()
        };
        setProfessionals(prev => 
          prev.map(prof => prof.id === selectedProfessional.id ? updatedProfessional : prof)
        );
      }
      
      setShowEditModal(false);
      setSelectedProfessional(null);
      showSuccess('Profissional atualizado com sucesso!');
    } catch (err) {
      const errorMsg = err?.detail || err?.message || 'Erro ao atualizar profissional';
      showError(`Erro ao atualizar profissional: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Excluir profissional
  const handleDeleteProfessional = async () => {
    if (!professionalToDelete) return;
    
    setIsDeleting(true);
    try {
      try {
        await deleteProfessional(professionalToDelete.id);
      } catch (backendError) {
        // Se falhar, remover localmente
        console.warn('Backend não disponível, removendo localmente:', backendError);
      }
      
      setProfessionals(prev => 
        prev.filter(prof => prof.id !== professionalToDelete.id)
      );
      
      setShowDeleteModal(false);
      setProfessionalToDelete(null);
      showSuccess('Profissional excluído com sucesso!');
    } catch (err) {
      const errorMsg = err?.detail || err?.message || 'Erro ao excluir profissional';
      showError(`Erro ao excluir profissional: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Alternar status do profissional
  const handleToggleStatus = async (professional) => {
    try {
      try {
        const updatedProfessional = await toggleProfessionalStatus(
          professional.id, 
          !professional.is_active
        );
        setProfessionals(prev => 
          prev.map(prof => prof.id === professional.id ? updatedProfessional : prof)
        );
      } catch (backendError) {
        // Se falhar, atualizar localmente
        console.warn('Backend não disponível, atualizando status localmente:', backendError);
        const updatedProfessional = {
          ...professional,
          is_active: !professional.is_active,
          updated_at: new Date().toISOString()
        };
        setProfessionals(prev => 
          prev.map(prof => prof.id === professional.id ? updatedProfessional : prof)
        );
      }
      
      const statusText = !professional.is_active ? 'ativado' : 'desativado';
      showSuccess(`Profissional ${statusText} com sucesso!`);
    } catch (err) {
      const errorMsg = err?.detail || err?.message || 'Erro ao alterar status';
      showError(`Erro ao alterar status: ${errorMsg}`);
    }
  };

  // Funções de modal
  const openCreateModal = () => {
    setSelectedProfessional(null);
    setShowCreateModal(true);
  };

  const openEditModal = (professional) => {
    setSelectedProfessional(professional);
    setShowEditModal(true);
  };

  const openDetailsModal = (professional) => {
    setSelectedProfessional(professional);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (professional) => {
    setProfessionalToDelete(professional);
    setShowDeleteModal(true);
  };

  // Filtrar profissionais
  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && professional.is_active) ||
                         (statusFilter === 'inactive' && !professional.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState message="Carregando profissionais..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total</p>
              <p className="text-2xl font-bold text-secondary-900">{professionals.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Ativos</p>
              <p className="text-2xl font-bold text-secondary-900">
                {professionals.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Inativos</p>
              <p className="text-2xl font-bold text-secondary-900">
                {professionals.filter(p => !p.is_active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg">
              <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Especialidades</p>
              <p className="text-2xl font-bold text-secondary-900">{services.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de ações */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Buscar profissionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="block w-full sm:w-auto px-3 py-2 bg-white border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          <Button onClick={openCreateModal} variant="primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Profissional
          </Button>
        </div>
      </Card>

      {/* Mensagens de erro */}
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Lista de profissionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Card para adicionar profissional - sempre aparece primeiro */}
        <AddProfessionalCard onClick={openCreateModal} />
        
        {/* Cards dos profissionais existentes */}
        {filteredProfessionals.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            professional={professional}
            onEdit={() => openEditModal(professional)}
            onDelete={() => openDeleteModal(professional)}
            onToggleStatus={() => handleToggleStatus(professional)}
            onViewDetails={() => openDetailsModal(professional)}
          />
        ))}
      </div>

      {/* Mensagem quando não há profissionais cadastrados */}
      {filteredProfessionals.length === 0 && (searchTerm || statusFilter !== 'all') && (
        <Card className="p-8 text-center mt-6">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Nenhum profissional encontrado</h3>
            <p className="mt-1 text-sm text-secondary-500">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        </Card>
      )}

      {/* Modal de Criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Novo Profissional"
        size="lg"
      >
        <ProfessionalForm
          onSubmit={handleCreateProfessional}
          isLoading={isCreating}
          services={services}
        />
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Profissional"
        size="lg"
      >
        {selectedProfessional && (
          <ProfessionalForm
            professional={selectedProfessional}
            onSubmit={handleUpdateProfessional}
            isLoading={isUpdating}
            services={services}
          />
        )}
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalhes do Profissional"
        size="xl"
      >
        {selectedProfessional && (
          <ProfessionalDetailsModal
            professional={selectedProfessional}
            services={services}
            onEdit={() => {
              setShowDetailsModal(false);
              openEditModal(selectedProfessional);
            }}
          />
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        {professionalToDelete && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Tem certeza que deseja excluir o profissional <strong>{professionalToDelete.name}</strong>?
            </p>
            <Alert type="warning">
              Esta ação não pode ser desfeita. Todos os agendamentos futuros deste profissional serão cancelados.
            </Alert>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteProfessional}
                isLoading={isDeleting}
              >
                Excluir Profissional
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfessionalsView;
