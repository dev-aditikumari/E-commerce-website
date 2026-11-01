import React from 'react'
import './Itemss.css'
import { Link } from 'react-router-dom'
import { money } from '../../utils/money'

export const Itemss = (props) => {
  return (
    <div className='item'>
      <Link to={`/product/${props.id}`} onClick={() => window.scrollTo(0, 0)}>
        <img src={props.image} alt={props.name} />
      </Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">{money(props.new_price)}</div>
        <div className="item-price-old">{money(props.old_price)}</div>
      </div>
    </div>
  )
}
export default Itemss
