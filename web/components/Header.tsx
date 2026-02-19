import { Logo } from "./Logo";
import { ThemeToggle } from "./theme/toggle-theme";

const Header = () => {
	return (
		<header className='flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#302839] px-6 lg:px-10 py-3 bg-white/50 dark:bg-[#141118]/90 backdrop-blur-md fixed top-0 w-full z-50 '>
			<nav className='w-full flex justify-between items-center'>
				<Logo/>
				<h1 className='text-foreground'>TryOra</h1>
				<ThemeToggle />
			</nav>
		</header>
	);
};

export default Header;
