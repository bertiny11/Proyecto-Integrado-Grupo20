import { useState } from 'react';
import Login from './Login';
import Registro from './Registro';
import './App.css';

function App() {
  const [vista, setVista] = useState('login'); // 'login' o 'registro'

  return (
    <div className="app-container">
      <header>
        <h1>PadelUp 🎾</h1>
      </header>

      <main>
        {vista === 'login' && <Login cambiarVista={setVista} />}
        {vista === 'registro' && <Registro cambiarVista={setVista} />}
      </main>
    </div>
  );
}

export default App;
