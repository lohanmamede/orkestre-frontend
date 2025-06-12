import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import Alert from '../components/common/Alert';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [establishmentName, setEstablishmentName] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento
    const [error, setError] = useState(''); // Estado para mensagens de erro da API

    const navigate = useNavigate(); // Hook para navegação

    const handleChange = (event) => {
        const { name, value } = event.target;
        setError('');
        if (name === 'email') {
            setEmail(value);
        } else if (name === 'password') {
            setPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        } else if (name === 'establishmentName') {
            setEstablishmentName(value);
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
            // Payload para o registro
            const userData = {
                email,
                password,
                establishment_name: establishmentName // <<<--- CHAVE E VALOR ADICIONADOS
            };
            const responseData = await registerUser(userData); // Chama a API

            console.log('Usuário e Estabelecimento registrados com sucesso:', responseData);
            alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');

            // Limpar campos (opcional)
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setEstablishmentName('');

            navigate('/login'); // Redireciona para a página de login

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-secondary-900 mb-2">Crie sua conta</h1>
                    <p className="text-secondary-600">Comece a gerenciar seus agendamentos hoje mesmo</p>
                </div>

                <Card>
                    {error && (
                        <Alert type="error" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="Nome do Estabelecimento"
                            type="text"
                            name="establishmentName"
                            placeholder="Ex: Salão de Beleza Maria"
                            value={establishmentName}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />

                        <InputField
                            label="Seu Email"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Senha"
                                type="password"
                                name="password"
                                placeholder="Sua senha"
                                value={password}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                                hint="Mínimo 8 caracteres"
                                icon={
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                }
                            />

                            <InputField
                                label="Confirmar Senha"
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirme sua senha"
                                value={confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                                icon={
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                        </div>

                        <Alert type="info">
                            <div className="text-sm">
                                <p className="font-medium mb-1">O que você terá:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Sistema completo de agendamentos</li>
                                    <li>• Página pública para clientes agendarem</li>
                                    <li>• Gestão de serviços e horários</li>
                                    <li>• Notificações automáticas</li>
                                </ul>
                            </div>
                        </Alert>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-secondary-600">
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                                Faça login aqui
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

export default RegisterPage;