import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.png'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { server } from '../constants/config'
import { expireLoginToken, getTokenFromStorage } from '../utils/features'
import { setUser } from '../redux/api/auth'
import axios from 'axios'


const Header = () => {
    const { user } = useSelector((state) => state.auth);

    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    const dispatch = useDispatch();

    const logoutHandler = async () => {
        try {
            await axios.get(`${server}/api/v1/user/logout`, {
                headers: {
                    "authorization": `Bearer ${getTokenFromStorage()}`,
                },
                withCredentials: true,
            });
            expireLoginToken();
            dispatch(setUser(null));
        } catch (error) {
            // console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        axios.get(`${server}/api/v1/user/me`, {
            headers: {
                "authorization": `Bearer ${getTokenFromStorage()}`,
            },
            withCredentials: true,
        })
            .then(({ data }) => {
                return dispatch(setUser(data?.data))
            })
            .catch((error) => {
                return dispatch(setUser(null));
            });

        return () => document.removeEventListener('mousedown', handleOutsideClick);

    }, [dispatch]);

    return (
        <nav className='flex justify-between items-center ' style={{ padding: '10px' }}>

            <div>
                <Link to="/">
                    <div className=' flex gap-2 '>
                        <img src={Logo} alt="" loading="lazy" className='w-13 h-10  rounded-full' />
                        <div>
                            <h1 className='text-2xl font-bold'>ELITE </h1>
                            <p className='text-sm -mt-2'>Barber Shop</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Login/Signup Button */}
            {!user ? (<Link
                to="/login"
                className="flex text-white font-bold bg-[#988bf7] rounded-[10px] items-center gap-2 hover:bg-[#b0a7f7] cursor-pointer transition-colors px-4 py-2"
            >
                Login/SignUp
            </Link>) : (
                <div className="flex items-center gap-2">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="flex items-center gap-2 cursor-pointer bg-transparent border-0"
                            aria-haspopup="true"
                            aria-expanded={open}
                        >
                            {user ? (
                                <img
                                    src={user.profileUrl}
                                    alt={user.name || 'User'}
                                    loading="lazy"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                            <span className="hidden md:inline text-sm font-medium">
                                {user.name}
                            </span>
                            {open ? <ChevronDown className="w-4 h-4 transform rotate-180" /> : <ChevronDown className='w-4 h-4' />}
                        </button>

                        {/* Dropdown menu (click to toggle) */}
                        <div
                            className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg transition-all duration-200 z-50 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="py-2">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                {
                                    user && user.role === 'barber' ? (
                                        <>
                                        <Link
                                            to="/barber/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                    onClick={logoutHandler}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                                </>
                                    ) : user.role === 'admin'? (
                                        <>
                                        <Link
                                            to="/admin/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                    onClick={logoutHandler}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={logoutHandler}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </nav>
    )
}

export default Header