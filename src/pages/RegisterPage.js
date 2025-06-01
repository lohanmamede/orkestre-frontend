import React, { useState } from 'react';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate e Link
import { registerUser } from '../services/authService'; // Importe nossa função de serviço

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento
  const [error, setError] = useState(''); // Estado para mensagens de erro da API

  const navigate = useNavigate(); // Hook para navegação

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError(''); // Limpa erros anteriores ao digitar
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
  };

  const handleSubmit = async (event) => { // Transforme em async
    event.preventDefault();
    setError(''); // Limpa erros anteriores

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!");
      return;
    }

    setIsLoading(true); // Ativa o estado de carregamento

    try {
      const userData = { email, password };
      const responseData = await registerUser(userData); // Chama a API

      console.log('Usuário registrado com sucesso:', responseData);
      alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');

      // Limpar campos (opcional)
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      navigate('/login'); // Redireciona para a página de login

    } catch (apiError) {
      console.error('Erro no cadastro pela API:', apiError);
      // apiError pode ser o objeto de erro da API (ex: { detail: "Mensagem de erro" })
      // ou um Error genérico se a requisição falhou antes de chegar na API
      const errorMessage = apiError.detail || apiError.message || 'Falha ao registrar. Tente novamente.';
      setError(errorMessage);
      alert(`Erro no cadastro: ${errorMessage}`); // Mostra um alerta simples
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento, independente do resultado
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Criar Conta - Orkestre Agenda</h2>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>} {/* Mostra mensagem de erro */}
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="seuemail@example.com"
            value={email}
            onChange={handleChange}
            disabled={isLoading} // Desabilita input durante o carregamento
          />
          <InputField
            label="Senha"
            type="password"
            name="password"
            placeholder="********"
            value={password}
            onChange={handleChange}
            disabled={isLoading}
          />
          <InputField
            label="Confirmar Senha"
            type="password"
            name="confirmPassword"
            placeholder="********"
            value={confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar'} {/* Feedback no botão */}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Já tem uma conta? <Link to="/login" className="text-blue-500 hover:text-blue-700">Faça login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;