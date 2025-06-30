import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBell, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { logout } from '../../features/auth/authSlice';
import logo from '../../assets/dimensions-logo.png';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & mobile menu button */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-dimensions-primary p-2"
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center dimensions-logo">
              <img src={logo} alt="Dimensions Logo" />
            </div>
          </div>
          {/* Add the rest of your header content here, e.g., navigation, profile, etc. */}
        </div>
      </div>
    </header>
  );
};

export default Header;