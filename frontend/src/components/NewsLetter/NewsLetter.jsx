import React, { useState } from 'react'
import './NewsLetter.css'
import { api } from '../../services/api'

export const NewsLetter = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)

  const subscribe = async (e) => {
    e.preventDefault()
    try {
      const data = await api('/newsletter', { method: 'POST', body: { email } })
      setMessage({ ok: true, text: data.message })
      setEmail('')
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    }
  }

  return (
    <div className='newsletter'>
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newsletter and stay updated</p>
      <form onSubmit={subscribe}>
        <input type="email" placeholder='Your Email id' value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Subscribe</button>
      </form>
      {message && <p className={message.ok ? 'promo-ok' : 'promo-error'}>{message.text}</p>}
    </div>
  )
}
