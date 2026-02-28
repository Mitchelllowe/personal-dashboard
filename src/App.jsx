import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CheckIn from './pages/CheckIn'
import ScriptureReading from './pages/ScriptureReading'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/scripture" element={<ScriptureReading />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
