import React, { useContext } from 'react'
import './NewCollections.css'
import Item from '../Itemss/Itemss'
import { ShopContext } from '../../context/ShopContext'

export const NewCollections = () => {
  const { newCollections } = useContext(ShopContext)
  return (
    <div className='newcollections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {newCollections.map((item) => (
          <Item key={item.id} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price} />
        ))}
      </div>
    </div>
  )
}
