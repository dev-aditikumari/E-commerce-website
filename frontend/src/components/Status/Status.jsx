import React, { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'

// shown instead of a page while the products are loading or could not be loaded
const Status = () => {
  const { loading, error, reloadProducts } = useContext(ShopContext)
  if (loading) return <div className='status-box'><p>Loading...</p></div>
  if (error) {
    return (
      <div className='status-box'>
        <p>{error}</p>
        <button onClick={reloadProducts}>Try again</button>
      </div>
    )
  }
  return null
}
export default Status
