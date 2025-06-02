import React, { useState } from 'react';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate e Link
import { loginUser } from '../services/authService'; // Importe nossa função de serviço de login
import { useAuth } from '../contexts/AuthContext'; // Importe o hook useAuth

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento
    const [error, setError] = useState(''); // Estado para mensagens de erro da API

    const navigate = useNavigate(); // Hook para navegação

    const { login } = useAuth();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setError(''); // Limpa erros anteriores ao digitar
        if (name === 'email') {
            setEmail(value);
        } else if (name === 'password') {
            setPassword(value);
        }
    };

    const handleSubmit = async (event) => { // Transforme em async
        event.preventDefault();
        setError(''); // Limpa erros anteriores
        setIsLoading(true); // Ativa o estado de carregamento

        // Dentro do handleSubmit, antes do try...catch
        const payload = { email, password }; // Para Login. 
        // Para Register, se tiver confirmPassword, seria só { email, password }
        // pois o backend UserCreate só espera email e password.
        console.log('Dados que serão enviados para a API:', payload);
        setIsLoading(true);

        try {
            const credentials = { email, password };
            const responseData = await loginUser(credentials); // Chama a API de login

            // Agora, em vez de salvar no localStorage aqui, chamamos a função login do AuthContext
            if (responseData && responseData.access_token) {
                login(responseData.access_token); // <<<--- CHAME A FUNÇÃO LOGIN DO CONTEXTO AQUI
                console.log('Login bem-sucedido, token passado para AuthContext:', responseData.access_token);
                alert('Login realizado com sucesso! Você será redirecionado para o dashboard.');
                navigate('/dashboard'); // Redireciona para a página de dashboard
            } else {
                // Caso a API não retorne o token esperado, mesmo com sucesso na chamada
                throw new Error('Token de acesso não recebido da API.');
            }

        } catch (apiError) {
            console.error('Erro na API:', apiError); // Logue o erro completo para debug
            let displayErrorMessage = 'Ocorreu um erro. Tente novamente.'; // Mensagem padrão

            if (apiError.detail) {
                if (Array.isArray(apiError.detail)) {
                    // Se 'detail' for um array de erros (comum para erros de validação do Pydantic)
                    // Vamos pegar a mensagem do primeiro erro para simplificar
                    displayErrorMessage = apiError.detail[0].msg || 'Erro de validação.';
                } else if (typeof apiError.detail === 'string') {
                    // Se 'detail' for uma string (como nossos erros customizados "Email ou senha incorretos")
                    displayErrorMessage = apiError.detail;
                }
                // Se apiError.detail for um objeto único, você pode querer extrair a msg dele também,
                // mas o padrão do FastAPI para ValidationError é um array em 'detail'.
            } else if (apiError.message) {
                // Se não houver 'detail', mas houver 'message' (ex: Network Error)
                displayErrorMessage = apiError.message;
            }

            setError(displayErrorMessage);
            alert(`Erro: ${displayErrorMessage}`); // O alert também deve mostrar uma string
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Login - Orkestre Agenda</h2>
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
                    <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'} {/* Feedback no botão */}
                    </Button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Não tem uma conta? <Link to="/cadastro" className="text-blue-500 hover:text-blue-700">Cadastre-se</Link>
                </p>
                {/* Adicionar link "Esqueci minha senha" no futuro */}
            </div>
        </div>
    );
};

export default LoginPage;