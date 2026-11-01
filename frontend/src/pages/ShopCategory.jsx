import React, { useContext, useState } from "react";
import "./CSS/ShopCategory.css";

import { ShopContext } from "../context/ShopContext";
import Itemss from "../components/Itemss/Itemss";
import Status from "../components/Status/Status";

const ShopCategory = (props) => {
  const { all_product, loading, error } = useContext(ShopContext);
  const [sort, setSort] = useState("default");

  const products = all_product
    .filter((item) => item.category === props.category)
    .sort((a, b) => {
      if (sort === "price-asc") return a.new_price - b.new_price;
      if (sort === "price-desc") return b.new_price - a.new_price;
      return a.id - b.id;
    });

  return (
    <div className="shop-category">
      <img className="shopcategory-banner" src={props.banner} alt="" />
      <div className="shopcategory-indexSort">
        <p>
          <span>Showing {products.length}</span> products
        </p>
        <label className="shopcategory-sort">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      {loading || error ? (
        <Status />
      ) : (
        <div className="shopcategory-products">
          {products.map((item) => (
            <Itemss key={item.id} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price} />
          ))}
        </div>
      )}
    </div>
  );
};
export default ShopCategory;
