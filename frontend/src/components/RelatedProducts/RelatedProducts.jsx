import React, { useContext } from 'react'
import './RelatedProducts.css'
import Itemss from '../Itemss/Itemss'
import { ShopContext } from '../../context/ShopContext'

// up to four other products from the same category
const RelatedProducts = ({ product }) => {
  const { all_product } = useContext(ShopContext)
  const related = all_product.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className='relatedproducts-item'>
        {related.map((item) => (
          <Itemss key={item.id} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price} />
        ))}
      </div>
    </div>
  )
}
export default RelatedProducts
