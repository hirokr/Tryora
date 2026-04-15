"use client";

import { useMemo, useState } from "react";

import { MarketplaceHero } from "./_components/MarketplaceHero";
import { MarketplaceToast } from "./_components/MarketplaceToast";
import { MarketplaceTopBar } from "./_components/MarketplaceTopBar";
import { ProductGrid } from "./_components/ProductGrid";
import type { FilterType, Product } from "../../../types/producttypes";

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Premium Silk Jamdani Saree",
    price: "BDT 12,500",
    category: "Heritage",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC464RqHc63IUqb2iWOG12qPW7QxkuPhmqtclIH0FD_DyAIp6KwWe19aBbjcCmpoJSXqGg51mJAo4cLich0dRMhYU4GquqfIqVF1kz4SrhVilEY-t8ln1tl3hdNWlvMzW8WYg71GhL7ShqG2Lxz2LhVH1HQYkbXHkYL95zXRUNVVYiJkEGyjE0cnU710UwSn1H3IsAlD_aYS33UmZe-mlrsgz-t3y9P5Q2iZNrOmgZCGMTUMVxQPbZSS3ZODBcrtupBt4HaQYTPjWtB",
    alt: "Intricate blue silk jamdani saree with gold border",
  },
  {
    id: 2,
    name: "Handcrafted Panjabi",
    price: "BDT 4,200",
    category: "Linen",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmvBL72jfXZGoVRfhxc-MWTOpr33a7LtnSAbfoG64GzWVGqhSF5hAXmis40LoUs8J0lg4rue1Ksq5EWX2xu1WMVN4ubLXCPBrwu5szB0KTPP6Owy8CckvNnJJWjdJzfafLsEjqpqLofG7rToPLQySMmN7eIbcWVrYMiqBHyzu1rXOlmHcyBaOrkyRvl6ih8s2exRzd4BuunbyEc72Uxc5wN2eLoGHX3xio8AU22du-EYP4Kzte_lbbwFfyXHl9QrpqkRwLs6t_z0Ek",
    alt: "Handcrafted men's panjabi in white linen with embroidery",
  },
  {
    id: 3,
    name: "Floral Kameez Set",
    price: "BDT 5,800",
    category: "Cotton",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkCUx_oCGmRfqZQuOpeCBfgp_jKFnhoYOftRE85zyND6TeWMR8FJZgRyXmJwMYz8wa3MHuSlAycJ7z4tJM5JwEvc6hfmeTx1FgxbTnKdskrC886L1L7y7u1aSc24Vbb8Z6YXY2fDp1U1PWs6V2lplQO1ftFBGbfkH52BA45jtjDnKBNtck7LG-G8ANiO6Pwi-EhYeL-ITkS7xEZMlsB0NKCjPe1lr5nqWC6h9eZBdGH72T1Unt1jJLnKT-VYqIyIHpKjKHTo0UvkjM",
    alt: "Floral embroidered kameez set in pastel pink",
  },
  {
    id: 4,
    name: "Leather Juttis",
    price: "BDT 2,500",
    category: "Footwear",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCa7ti8myb3pGLx54fVRAtl6Bsg_i_RZDR2d-x-TnUBPKhr-S38wPPxijRYLNHxZXyTEJmBHDypSp3njTMDk8xSJruBfkLYhjURq2ekMfXRSsq0J1CzboxU7RVk-kucrw3cfK_88ptE6WS8Afd_I0F2qxkGAWx6QVsgLD1cuof_QT99bkOuzwycu-2eh2Ma1_jy_Ckc2pDd27om_R0p8m_lXqN-V4V12edv5qz-gFE-4QAvC96qdzl8GGiAOMHlIjRR5dnY0JBCOEsN",
    alt: "Traditional leather juttis with embroidery",
  },
  {
    id: 5,
    name: "Beaded Necklace",
    price: "BDT 1,200",
    category: "Jewelry",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8u0t1eymXwQjpEtF70cW4KCwKjbnQxObs2bOqGSJVZF8aH42objCKnjd9wMyGWxO69DvpdUW86PXCwZSk7zPjj0VxBqTF3X841dVqSjxmE-QlRbkyD-iFnpOlSAVi3Mnd2NktFqxYNYzLRJEsgy79ZW1mjTc1mE14-c90Xj8f0wdJJ22SgS8ILuV6_0JPL8bA7WUWNewiKQEtWaBJm5yQOxnEN-VfqYCJnoY7wsw-U5ay1BO6Iown6OKGLXXFg1gzI28sT9GpAlOi",
    alt: "Handcrafted beaded necklace with silver accents",
  },
  {
    id: 6,
    name: "Designer Cotton Kurti",
    price: "BDT 3,500",
    category: "Casual",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDli5lJ1W054FxUAElra1cjV0RZWDortRe0bB2KaVWspaA1y9JrE7zNz30DLtRTk_tvIoR5cMnqPHxc-gjbfsHvehkUqUDJzTKvtoDMYEosPDCbmmQcLaoe__XUxybRx_sjN8onyA3EuaMLo_Gz_jYIlFS9ORxiGlr-u0WcasPD_mYiq8Ms0wYZ3Uw8y8uY70P7oXxmtUMJDNpKbzyNznGMzyQcu85_vPCT37JnF--7dvvYdtC_NqkV9sWfHPCpA6rtqDxIeY-0QQRK",
    alt: "Modern cotton kurti with block print design",
  },
  {
    id: 7,
    name: "Nakshi Kantha Scarf",
    price: "BDT 2,200",
    category: "Artisan",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ2wkjQDYLfmjfFunAsXb_PUig9-EgVcBcTlnbLIeHEl6-y1TrSYIW0Ge4oo_aVFizxaytDvedY5vrVwrHW495LooMwS8m37R5Pfx7VAwkJwqU1dhR8TCg0IoqC8q9-cfOPFaZhDcdAO0rjN7UM05wR8kU8NV2bP73tda51QXFAdmg7y7Q_tF0BittmDwKSjBZUvj58llxM8Wjj23buKs1eTiac_WWZF0UV8nwJCikzvso4vj99U1JomErQPRiK7F42X_Rpa7gjdyK",
    alt: "Traditional Nakshi Kantha embroidered cloth",
  },
  {
    id: 8,
    name: "Linen Blend Shirt",
    price: "BDT 1,850",
    category: "Modern",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLXN_8_ieynerFHcsI5x7Y35mhb-mXkr2rcRVPbGMTGJs5FQhRGyUKGRyZh4cWeMjmFlvJu0JoD4bQdG0qVseOtJRO0zx1q-HUo5Z7fD2-1mn1d0NmxUjDtTemq9SVqi3-nVzcpQfPdAMMW6smxHP1k-NiUzN1h3Dhd77s-U_5650Z5-dOOd_FM-gSbX_yznpAk5B2J5YumwIVXKb2T6-qcmnvX7z1dTtPs_rJndnvuVy1qg1BWNav4RAsk3-4CuTof9l9jx35xhUd",
    alt: "Classic linen shirt in olive green",
  },
];

const ACCESSORIES_CATEGORIES = new Set(["Footwear", "Jewelry", "Artisan"]);

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [toastVisible, setToastVisible] = useState(true);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "All") {
      return PRODUCTS;
    }

    if (activeFilter === "Accessories") {
      return PRODUCTS.filter((product) => ACCESSORIES_CATEGORIES.has(product.category));
    }

    return PRODUCTS.filter((product) => !ACCESSORIES_CATEGORIES.has(product.category));
  }, [activeFilter]);

  return (
      <main className="flex min-h-screen flex-col overflow-hidden bg-background-light pt-24 dark:bg-background-dark">
        <MarketplaceTopBar />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <MarketplaceHero activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <ProductGrid products={filteredProducts} />
          </div>

          {toastVisible && <MarketplaceToast onClose={() => setToastVisible(false)} />}
        </div>
      </main>
  );
}
