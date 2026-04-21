export type Product = {
  id: string | number;
  name: string;
  price: string;
  category: string;
  img: string;
  alt: string;
};

export type FilterType = "All" | "Cloth" | "Accessaries" | "Shoes";

export type NavItem = {
  icon: string;
  label: string;
  active: boolean;
};
