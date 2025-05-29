// Em src/App.js
import './App.css'; // Se você tiver este arquivo, pode mantê-lo ou remover se não usar

function App() {
  return (
    <div className="App p-10"> {/* Adicionando um padding grande com Tailwind */}
      <header className="App-header">
        <h1 className="text-4xl font-bold text-purple-600 hover:text-purple-800 underline">
          Umamão Agenda com Tailwind CSS Funcionando!
        </h1>
        <p className="mt-4 bg-green-200 text-green-800 p-2 rounded">
          Este parágrafo deve ter um fundo verde claro e texto verde escuro!
        </p>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Botão Estilizado
        </button>
      </header>
    </div>
  );
}

export default App;