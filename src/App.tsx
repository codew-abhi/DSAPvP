import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import UsernameModal from './components/UsernameModal';
import { AuthProvider } from './context/AuthContext';
import Arena from './pages/Arena';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UsernameModal />
        <Routes>
          <Route path='/' element={<Landing />}></Route>
          <Route path='/profile' element={<Profile />}></Route>
          <Route path='/arena/:code' element={<Arena />}></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
