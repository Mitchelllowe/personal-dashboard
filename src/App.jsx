import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CheckIn from './pages/CheckIn'
import ScriptureReading from './pages/ScriptureReading'
import Personal from './pages/Personal'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/scripture" element={<ScriptureReading />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
