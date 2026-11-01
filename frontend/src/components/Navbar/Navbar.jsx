import React from 'react'
import './Navbar.css'
import logo from '../Assets/logo.png'
import cart_icon from '../Assets/cart_icon.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'

export const Navbar = () => {
  const { getTotalCartItems, user, logout } = useContext(ShopContext)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const links = [
    { label: 'Shop', to: '/', active: pathname === '/' },
    { label: 'Men', to: '/mens', active: pathname === '/mens' },
    { label: 'Women', to: '/womens', active: pathname === '/womens' },
    { label: 'Kids', to: '/kids', active: pathname === '/kids' },
  ]

  return (
    <div className='navbar'>
      <div className="nav-logo">
        <img src={logo} alt="" />
        <p>SHOPPER</p>
      </div>
      <ul className="nav-menu">
        {links.map((l) => (
          <li key={l.to}>
            <Link style={{ textDecoration: 'none' }} to={l.to}>{l.label}</Link>
            {l.active ? <hr /> : null}
          </li>
        ))}
      </ul>
      <div className="nav-login-cart">
        {user ? (
          <>
            <Link to='/orders' className='nav-user-link'>Hi, {user.name.split(' ')[0]}</Link>
            <button onClick={() => { logout(); navigate('/') }}>Logout</button>
          </>
        ) : (
          <Link to='/login'><button>Login</button></Link>
        )}
        <Link to='/cart'><img src={cart_icon} alt='Cart' /></Link>
        <div className="nav-cart-count">{getTotalCartItems()}</div>
      </div>
    </div>
  )
}
