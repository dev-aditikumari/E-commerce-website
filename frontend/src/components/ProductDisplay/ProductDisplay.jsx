import React, { useContext, useState } from 'react'
import './ProductDisplay.css'
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from '../../context/ShopContext';
import { money } from '../../utils/money';

const CATEGORY_LABEL = { men: 'Men', women: 'Women', kid: 'Kids' }

const ProductDisplay = ({ product }) => {
  const { addToCart } = useContext(ShopContext);
  const [size, setSize] = useState('M');
  const [added, setAdded] = useState(false);

  const add = async () => {
    await addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className='productdisplay'>
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          <img src={product.image} alt="" />
          <img src={product.image} alt="" />
          <img src={product.image} alt="" />
          <img src={product.image} alt="" />
        </div>
        <div className="productdisplay-img">
          <img className='productdisplay-main-img' src={product.image} alt={product.name} />
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-stars">
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_dull_icon} alt="" />
        </div>
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">{money(product.old_price)}</div>
          <div className="productdisplay-right-price-new">{money(product.new_price)}</div>
        </div>
        <div className="productdisplay-right-description">{product.description}</div>
        <div className="productdisplay-right-size">
          <h1>Select Size</h1>
          <div className="productdisplay-right-sizes">
            {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
              <div key={s} onClick={() => setSize(s)} className={size === s ? 'size-selected' : ''}>{s}</div>
            ))}
          </div>
        </div>
        <button onClick={add}>{added ? 'ADDED TO CART' : 'ADD TO CART'}</button>
        <p className='productdisplay-right-category'><span>Category :</span>{CATEGORY_LABEL[product.category]}</p>
      </div>
    </div>
  )
}
export default ProductDisplay
