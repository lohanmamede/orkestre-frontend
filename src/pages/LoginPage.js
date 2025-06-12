import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import Alert from '../components/common/Alert';

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
    };    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12">
            <Container size="sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-secondary-900 mb-2">Bem-vindo de volta</h1>
                    <p className="text-secondary-600">Entre na sua conta do Orkestre Agenda</p>
                </div>

                <Card>
                    {error && (
                        <Alert type="error" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                        
                        <InputField
                            label="Senha"
                            type="password"
                            name="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-secondary-600">
                            Não tem uma conta?{' '}
                            <Link to="/cadastro" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                                Cadastre-se aqui
                            </Link>
                        </p>
                    </div>
                </Card>

                <div className="text-center mt-8 text-sm text-secondary-500">
                    © 2024 Orkestre Agenda. Todos os direitos reservados.
                </div>
            </Container>
        </div>
    );
};

export default LoginPage;