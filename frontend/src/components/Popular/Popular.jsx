import React, { useContext } from 'react'
import './Popular.css'
import Item from '../Itemss/Itemss'
import { ShopContext } from '../../context/ShopContext'

export const Popular = () => {
  const { popular } = useContext(ShopContext)
  return (
    <div className='popular'>
      <h1>Popular in women</h1>
      <hr />
      <div className="popular-item">
        {popular.map((item) => (
          <Item key={item.id} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price} />
        ))}
      </div>
    </div>
  )
}

export default Popular
