import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { Home } from './home';
import { Login } from './login';
import { Register } from './register';
import { Profile } from './profile';
import { Cart } from './cart';

function App() {
  return (
    <Router>
      <Routes>
      <Route path="" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </Router>
  );
}

export default App;
