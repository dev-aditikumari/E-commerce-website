import React, { useContext, useState } from 'react'
import './CartItems.css'
import { Link, useNavigate } from 'react-router-dom'
import { ShopContext } from '../../context/ShopContext'
import remove_icon from '../Assets/cart_cross_icon.png'
import { money } from '../../utils/money'

const CartItems = () => {
  const { all_product, cartItems, addToCart, removeFromCart, removeLine, user, promo, applyPromo, clearPromo,
    getSubtotal, getDiscount, getTotalCartAmount } = useContext(ShopContext)
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [promoMessage, setPromoMessage] = useState(null)
  const lines = all_product.filter((p) => cartItems[p.id] > 0)

  const submitPromo = async () => {
    if (!code.trim()) return
    try {
      const valid = await applyPromo(code)
      setPromoMessage({ ok: true, text: `${valid.code} applied: ${valid.percent}% off` })
      setCode('')
    } catch (err) {
      clearPromo()
      setPromoMessage({ ok: false, text: err.message })
    }
  }

  const checkout = () => {
    if (!user) return navigate('/login', { state: { from: '/checkout' } })
    navigate('/checkout')
  }

  if (!lines.length) {
    return (
      <div className='cartitems cart-empty'>
        <h1>Your cart is empty</h1>
        <p>Add something you like and it will show up here.</p>
        <Link to='/'>Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className='cartitems'>
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {lines.map((e) => (
        <div key={e.id}>
          <div className="cartitems-format cartitems-format-main">
            <img src={e.image} alt={e.name} className='carticon-product-icon' />
            <p>{e.name}</p>
            <p>{money(e.new_price)}</p>
            <div className='cartitems-qty'>
              <button aria-label='One less' onClick={() => removeFromCart(e.id)}>-</button>
              <span>{cartItems[e.id]}</span>
              <button aria-label='One more' onClick={() => addToCart(e.id)}>+</button>
            </div>
            <p>{money(e.new_price * cartItems[e.id])}</p>
            <img className='cartitems-remove-icon' src={remove_icon} onClick={() => removeLine(e.id)} alt='Remove from cart' />
          </div>
          <hr />
        </div>
      ))}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{money(getSubtotal())}</p>
            </div>
            <hr />
            {promo && (
              <>
                <div className="cartitems-total-item">
                  <p>Discount ({promo.code}, {promo.percent}%)</p>
                  <p>-{money(getDiscount())}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{money(getTotalCartAmount())}</h3>
            </div>
          </div>
          <button onClick={checkout}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cartitems-promocode">
          <p>If you have a promo code, enter it here</p>
          <div className="cartitems-promobox">
            <input type="text" placeholder='promo code' value={code} onChange={(e) => setCode(e.target.value)} />
            <button onClick={submitPromo}>Submit</button>
          </div>
          {promoMessage && <p className={promoMessage.ok ? 'promo-ok' : 'promo-error'}>{promoMessage.text}</p>}
        </div>
      </div>
    </div>
  )
}
export default CartItems
