import React from "react";
import {ThemeToggle } from "./theme/toggle-theme";

const Header = () => {
	return (
		<header className='bg-primary text-primary-foreground py-4 px-6'>
			<nav className='flex justify-between'>
				<h1>AI Shop</h1>
				<ThemeToggle />
			</nav>
		</header>
	);
};

export default Header;
