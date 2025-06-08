// src/components/dashboard/AgendaView.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointmentsByEstablishment, updateAppointmentStatus } from '../../services/appointmentService';

const AgendaView = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.establishment?.id) {
      const establishmentId = currentUser.establishment.id;
      setIsLoading(true);
      getAppointmentsByEstablishment(establishmentId)
        .then(data => {
          setAppointments(data);
        })
        .catch(err => {
          setError('Falha ao carregar a agenda.');
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updatedAppointment = await updateAppointmentStatus(appointmentId, newStatus);
      // Atualiza a lista de agendamentos na tela com o status novo
      setAppointments(prev => 
        prev.map(appt => (appt.id === appointmentId ? updatedAppointment : appt))
      );
    } catch (error) {
      alert('Falha ao atualizar o status.');
      console.error(error);
    }
  };

  if (isLoading) return <p>Carregando agenda...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 border rounded-lg shadow bg-white">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Seus Próximos Agendamentos</h3>
      {appointments.length === 0 ? (
        <p>Nenhum agendamento encontrado.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map(appt => (
            <li key={appt.id} className="p-3 border rounded-md bg-gray-50">
              <p><strong>Cliente:</strong> {appt.customer_name} ({appt.customer_phone})</p>
              <p><strong>Horário:</strong> {new Date(appt.start_time).toLocaleString('pt-BR')}</p>
              <p><strong>Status Atual:</strong> <span className="font-semibold">{appt.status}</span></p>
              <div className="mt-2">
                <label htmlFor={`status-${appt.id}`} className="text-sm mr-2">Mudar status para:</label>
                <select
                  id={`status-${appt.id}`}
                  defaultValue={appt.status}
                  onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                  className="p-1 border rounded"
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled_by_establishment">Cancelado</option>
                  <option value="no_show">Não Compareceu</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AgendaView;