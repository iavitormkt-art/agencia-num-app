import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Aviso, BarraPrototipo } from './components/ui'
import { Avisos, BoasVindas, Cadastro, Conexao, Evolucao, Inicio, Marca, Resultado, Seguranca, Status } from './screens/Cliente'
import { Clientes, ConsoleGestor, Diagnosticos, FormDiagnostico, SenhaGestor } from './screens/Gestor'
import { LojaProvider } from './store'

export default function App() {
  return (
    <LojaProvider>
      <HashRouter>
        <BarraPrototipo />
        <Aviso />
        <Routes>
          <Route path="/" element={<BoasVindas />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/seguranca" element={<Seguranca />} />
          <Route path="/status" element={<Status />} />
          <Route path="/resultado" element={<Resultado />} />
          <Route path="/conexao" element={<Conexao />} />
          <Route path="/marca" element={<Marca />} />
          <Route path="/evolucao" element={<Evolucao />} />
          <Route path="/avisos" element={<Avisos />} />
          <Route path="/gestor" element={<Diagnosticos />} />
          <Route path="/gestor/diagnostico/:id" element={<FormDiagnostico />} />
          <Route path="/gestor/clientes" element={<Clientes />} />
          <Route path="/gestor/senha" element={<SenhaGestor />} />
          <Route path="/admin" element={<ConsoleGestor />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </LojaProvider>
  )
}
