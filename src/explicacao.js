/* Explicação de cada pasta dentro de src:
- src/components: Contém todos os componentes React reutilizáveis, como botões, campos de entrada, etc.
- src/services: Contém serviços que interagem com a API, como autenticação, agendamentos, etc.
    O serviço de autenticação é responsável por interagir com a API para registrar, fazer login e obter detalhes do usuário.
    Ele usa o apiClient configurado para fazer requisições HTTP e tratar erros de forma centralizada.
    As funções retornam os dados necessários ou lançam erros que podem ser tratados pelos componentes que as chamam.
- src/contexts: Contém contextos React para gerenciar estados globais, como autenticação do usuário.
    src/contexts/AuthContext.js: Este arquivo define o contexto de autenticação, que é usado para gerenciar o estado do usuário autenticado em toda a aplicação. Ele fornece funções para login, logout e verificação de autenticação, além de armazenar o token JWT no localStorage.
- src/hooks: Contém hooks personalizados, como useAuth para gerenciar autenticação. 
- src/assets: Contém arquivos estáticos como imagens, fontes, etc.
- src/pages: Contém as páginas principais da aplicação, como Dashboard, Login, Registro, etc.
- src/utils: Contém funções utilitárias, como formatação de datas, validação de formulários, etc.
- src/styles: Contém arquivos CSS ou SCSS para estilização global ou de componentes específicos.
- src/hooks: Contém hooks personalizados, como useAuth, que permite acessar o estado de autenticação e as funções do AuthContext em qualquer componente.
- NÃO IMPLEMENTADO src/config: Contém arquivos de configuração, como constantes, temas, etc.
- NÃO IMPLEMENTADO src/reducers: Contém reducers para gerenciar estados complexos, se necessário.
- src/apiClient.js: Contém a configuração do cliente Axios para fazer requisições à API, incluindo interceptores para adicionar tokens de autenticação e tratar erros globalmente.
- src/index.js: Ponto de entrada da aplicação, onde o ReactDOM.render é chamado para renderizar o App dentro do AuthProvider.
- src/App.js: Componente principal da aplicação, onde as rotas são definidas e o AuthProvider é usado para envolver a aplicação.


// Entendendo como acontece todo o fluxo dos componentes internos (services, contextos, hooks, etc.) e como eles interagem entre si:
// O fluxo da aplicação é organizado de forma a separar responsabilidades e facilitar a manutenção. Aqui está uma visão geral de como os componentes internos interagem:
// - src/index.js: Ponto de entrada da aplicação, onde o ReactDOM.render é chamado para renderizar o App dentro do AuthProvider.
// - src/App.js: Componente principal da aplicação, onde as rotas são definidas e o AuthProvider é usado para envolver a aplicação.
// - src/contexts/AuthContext.js: Contexto que gerencia o estado de autenticação do usuário. Ele fornece funções para login, logout e verificação de autenticação.
// - src/services/authService.js: Contém funções para interagir com a API de autenticação, como registro, login e obtenção dos detalhes do usuário atual.
// - src/components: Contém componentes reutilizáveis, como botões, campos de entrada, etc., que são usados em várias partes da aplicação.
// - src/hooks: Contém hooks personalizados, como useAuth, que permite acessar o estado de autenticação e as funções do AuthContext em qualquer componente.
*/