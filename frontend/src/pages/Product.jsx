import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link, useParams } from 'react-router-dom';
import Breadcrum from '../components/Breadcrums/Breadcrum';
import ProductDisplay from '../components/ProductDisplay/ProductDisplay';
import DescriptionBox from '../components/DescriptionBox/DescriptionBox';
import RelatedProducts from '../components/RelatedProducts/RelatedProducts';
import Status from '../components/Status/Status';

export const Product = () => {
  const { all_product, loading, error } = useContext(ShopContext);
  const { productId } = useParams();

  if (loading || error) return <Status />;

  const product = all_product.find((e) => e.id === Number(productId));
  if (!product) {
    return (
      <div className='status-box'>
        <p>We could not find that product.</p>
        <Link to='/'>Back to the shop</Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrum product={product} />
      <ProductDisplay product={product} />
      <DescriptionBox description={product.description} />
      <RelatedProducts product={product} />
    </div>
  )
}
export default Product
