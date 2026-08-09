import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import MaterialDetailsPage from "./pages/MaterialDetailsPage";
import RegisterPage from "./pages/RegisterPage";

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
            </Routes>
        </BrowserRouter>
    );
}

export default App;