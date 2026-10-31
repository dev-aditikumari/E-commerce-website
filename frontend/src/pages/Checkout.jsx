import React, { useContext, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import './CSS/Checkout.css'
import { ShopContext } from '../context/ShopContext'
import { money } from '../utils/money'

export const Checkout = () => {
  const { user, all_product, cartItems, promo, getSubtotal, getDiscount, getTotalCartAmount, placeOrder } = useContext(ShopContext)
  const navigate = useNavigate()
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', line1: '', city: '', pincode: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lines = all_product.filter((p) => cartItems[p.id] > 0)

  if (!user) return <Navigate to='/login' state={{ from: '/checkout' }} replace />
  if (!lines.length) {
    return (
      <div className='status-box'>
        <p>Your cart is empty.</p>
        <Link to='/'>Continue shopping</Link>
      </div>
    )
  }

  const change = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const order = await placeOrder(address)
      navigate('/orders', { state: { placed: order._id }, replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className='checkout'>
      <form className='checkout-form' onSubmit={submit}>
        <h1>Delivery details</h1>
        <input name='fullName' placeholder='Full name' value={address.fullName} onChange={change} required />
        <input name='phone' placeholder='Phone number' value={address.phone} onChange={change} required />
        <input name='line1' placeholder='Address' value={address.line1} onChange={change} required />
        <div className='checkout-row'>
          <input name='city' placeholder='City' value={address.city} onChange={change} required />
          <input name='pincode' placeholder='Pincode' value={address.pincode} onChange={change} required />
        </div>
        <h2>Payment</h2>
        <label className='checkout-pay'>
          <input type='radio' checked readOnly /> Cash on delivery
        </label>
        {error && <p className='form-error'>{error}</p>}
        <button type='submit' disabled={busy}>{busy ? 'Placing order...' : 'PLACE ORDER'}</button>
      </form>

      <div className='checkout-summary'>
        <h1>Order summary</h1>
        {lines.map((p) => (
          <div key={p.id} className='checkout-line'>
            <img src={p.image} alt={p.name} />
            <p>{p.name}</p>
            <p>{cartItems[p.id]} x {money(p.new_price)}</p>
          </div>
        ))}
        <hr />
        <div className='checkout-total'><p>Subtotal</p><p>{money(getSubtotal())}</p></div>
        {promo && <div className='checkout-total'><p>Discount ({promo.code})</p><p>-{money(getDiscount())}</p></div>}
        <div className='checkout-total'><p>Shipping</p><p>Free</p></div>
        <div className='checkout-total checkout-grand'><p>Total</p><p>{money(getTotalCartAmount())}</p></div>
      </div>
    </div>
  )
}
export default Checkout
