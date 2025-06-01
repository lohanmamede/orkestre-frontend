import React, { useState } from 'react';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

// import { Link } from 'react-router-dom'; // Para o link "Não tem uma conta? Cadastre-se"
// Comentado o <Link to="/cadastro">...&lt;/Link> porque você precisará ter o react-router-dom configurado e o componente Link importado para ele funcionar. Mas a estrutura está aí.

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        if (name === 'email') {
            setEmail(value);
        } else if (name === 'password') {
            setPassword(value);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Agora você tem acesso a 'email' e 'password' aqui
        console.log('Dados do Login:', { email, password });
        // A lógica de chamada à API virá aqui no próximo passo
    };

    // ... (return jsx)


return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Login - Orkestre Agenda</h2>
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Email"
                    type="email"
                    name="email" // Importante para o handleChange genérico
                    placeholder="seuemail@example.com"
                    value={email} // Conecta ao estado 'email'
                    onChange={handleChange} // Chama handleChange quando o valor mudar
                />
                <InputField
                    label="Senha"
                    type="password"
                    name="password" // Importante para o handleChange genérico
                    placeholder="********"
                    value={password} // Conecta ao estado 'password'
                    onChange={handleChange} // Chama handleChange quando o valor mudar
                />
                <Button type="submit" className="w-full mt-6">
                    Entrar
                </Button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
                Não tem uma conta? {/* <Link to="/cadastro" className="text-blue-500 hover:text-blue-700">Cadastre-se</Link> */}
            </p>
            {/* Você pode adicionar um link para "Esqueci minha senha" aqui no futuro também */}
        </div>
    </div>
);
};
export default LoginPage;