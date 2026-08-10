import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import MaterialDetailsPage from "./pages/MaterialDetailsPage";
import RegisterPage from "./pages/RegisterPage";
import CreateMaterialPage from "./pages/CreateMaterialPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MyMaterialsPage from "./pages/MyMaterialsPage";

function App() {
    return (
        <BrowserRouter>
            <Navbar />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/biblioteka" element={<LibraryPage />} />
                <Route path="/prijava" element={<LoginPage />} />
                <Route
                    path="/materijal/:id"
                    element={<MaterialDetailsPage />}
                />
                <Route
                    path="/registracija"
                    element={<RegisterPage />}
                />
                <Route
                    path="/dodaj-materijal"
                    element={
                        <ProtectedRoute>
                            <CreateMaterialPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profil"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/moji-materijali"
                    element={
                        <ProtectedRoute>
                            <MyMaterialsPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;