import React, { useContext, useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import './CSS/Orders.css'
import { ShopContext } from '../context/ShopContext'
import { api } from '../services/api'
import { productImage } from '../utils/productImage'
import { money } from '../utils/money'

export const Orders = () => {
  const { user } = useContext(ShopContext)
  const location = useLocation()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api('/orders')
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
  }, [user])

  if (!user) return <Navigate to='/login' state={{ from: '/orders' }} replace />

  return (
    <div className='orders'>
      <h1>My orders</h1>
      {location.state?.placed && <p className='orders-success'>Thank you! Your order has been placed.</p>}
      {error && <p className='form-error'>{error}</p>}
      {orders === null && !error && <p>Loading...</p>}
      {orders && orders.length === 0 && (
        <p>You have not placed any orders yet. <Link to='/'>Start shopping</Link></p>
      )}
      {orders && orders.map((o) => (
        <div key={o._id} className='order-card'>
          <div className='order-head'>
            <div>
              <p className='order-id'>Order #{o._id.slice(-6).toUpperCase()}</p>
              <p className='order-date'>{new Date(o.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <span className={`order-status order-${o.status}`}>{o.status}</span>
          </div>
          {o.items.map((i) => (
            <div key={i.productId} className='order-item'>
              <img src={productImage(i.image)} alt={i.name} />
              <p>{i.name}</p>
              <p>{i.quantity} x {money(i.price)}</p>
            </div>
          ))}
          <div className='order-foot'>
            <p>Deliver to {o.address.fullName}, {o.address.line1}, {o.address.city} {o.address.pincode}</p>
            <p className='order-total'>
              {o.discount > 0 && <span>Discount {money(o.discount)} · </span>}
              Total {money(o.total)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
export default Orders
