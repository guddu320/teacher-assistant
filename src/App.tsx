import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppDataProvider } from './context/AppDataProvider'
import { ClassPage } from './pages/ClassPage'
import { DashboardPage } from './pages/DashboardPage'
import { ManageClassesPage } from './pages/ManageClassesPage'
import { StudentNotesPage } from './pages/StudentNotesPage'

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="classes" element={<ManageClassesPage />} />
            <Route path="class/:classId" element={<ClassPage />} />
            <Route
              path="class/:classId/student/:studentId"
              element={<StudentNotesPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  )
}
