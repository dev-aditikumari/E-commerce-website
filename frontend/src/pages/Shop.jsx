import React, { useContext } from 'react'
import Hero from '../components/Hero/Hero'
import Popular from '../components/Popular/Popular'
import { Offers } from '../components/Offers/Offers'
import { NewCollections } from '../components/NewCollections/NewCollections'
import { NewsLetter } from '../components/NewsLetter/NewsLetter'
import Status from '../components/Status/Status'
import { ShopContext } from '../context/ShopContext'

export const Shop = () => {
  const { loading, error } = useContext(ShopContext)
  return (
    <div>
      <Hero />
      {loading || error ? (
        <Status />
      ) : (
        <>
          <Popular />
          <Offers />
          <NewCollections />
        </>
      )}
      <NewsLetter />
    </div>
  )
}
export default Shop
