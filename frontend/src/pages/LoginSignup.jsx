import React, { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CSS/Loginsignup.css'
import { ShopContext } from '../context/ShopContext'

export const LoginSignup = () => {
  const { login, signup } = useContext(ShopContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signup') // "signup" or "login"
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && !agree) return setError('Please agree to the terms and privacy policy')
    setBusy(true)
    try {
      if (mode === 'signup') await signup(form.name, form.email, form.password)
      else await login(form.email, form.password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup')
    setError('')
  }

  return (
    <div className='loginsignup'>
      <form className="loginsignup-container" onSubmit={submit}>
        <h1>{mode === 'signup' ? 'Sign up' : 'Login'}</h1>
        <div className="loginsignup-fields">
          {mode === 'signup' && <input type="text" name="name" placeholder='Your Name' value={form.name} onChange={change} required />}
          <input type="email" name="email" placeholder='Email Address' value={form.email} onChange={change} required />
          <input type="password" name="password" placeholder='Password' value={form.password} onChange={change} required />
        </div>
        {mode === 'signup' && <p className='form-hint'>At least 8 characters, with a letter and a number.</p>}
        {error && <p className='form-error'>{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Please wait...' : 'Continue'}</button>
        <p className="loginsignup-login">
          {mode === 'signup' ? 'Already have an account ?' : 'New here ?'}
          <span onClick={switchMode}>{mode === 'signup' ? 'Login here' : 'Create an account'}</span>
        </p>
        {mode === 'signup' && (
          <div className="loginsignup-agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <p>By continuing, I agree to the terms and privacy policy.</p>
          </div>
        )}
      </form>
    </div>
  )
}
export default LoginSignup
